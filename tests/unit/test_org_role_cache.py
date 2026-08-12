from types import SimpleNamespace

from apps.api.core.cache.service import CacheService
from apps.api.core.security.permissions import Role
from apps.api.modules.organizations.service import OrganizationService


class FakeOrganizationRepository:
    def __init__(self) -> None:
        self.members: dict[tuple[int, str], SimpleNamespace] = {}
        self.get_member_calls = 0
        self.deleted_orgs: list[int] = []

    async def get_member(self, org_id: int, firebase_uid: str):
        self.get_member_calls += 1
        return self.members.get((org_id, firebase_uid))

    async def add_member(self, org_id: int, firebase_uid: str, email: str, role: Role):
        member = SimpleNamespace(
            id=len(self.members) + 1,
            organization_id=org_id,
            firebase_uid=firebase_uid,
            email=email,
            role=role,
        )
        self.members[(org_id, firebase_uid)] = member
        return member

    async def update_member_role(self, org_id: int, firebase_uid: str, role: Role):
        member = self.members.get((org_id, firebase_uid))
        if member is None:
            return None
        member.role = role
        return member

    async def remove_member(self, org_id: int, firebase_uid: str) -> bool:
        return self.members.pop((org_id, firebase_uid), None) is not None

    async def delete(self, org_id: int) -> bool:
        self.deleted_orgs.append(org_id)
        return True


class FakeCache:
    def __init__(self) -> None:
        self.values: dict[str, dict[str, str | None]] = {}
        self.deleted_keys: list[str] = []
        self.deleted_prefixes: list[str] = []

    async def get_json(self, key: str):
        return self.values.get(key)

    async def set_json(self, key: str, value: dict[str, str | None], ttl_seconds=None) -> None:
        self.values[key] = value

    async def delete(self, key: str) -> None:
        self.deleted_keys.append(key)
        self.values.pop(key, None)

    async def delete_prefix(self, prefix: str) -> None:
        self.deleted_prefixes.append(prefix)
        for key in [existing for existing in self.values if existing.startswith(prefix)]:
            self.values.pop(key, None)


class FailingRedisClient:
    async def get(self, key: str):
        raise RuntimeError("redis unavailable")


async def test_get_user_role_uses_cache_after_first_lookup() -> None:
    repo = FakeOrganizationRepository()
    repo.members[(7, "user-1")] = SimpleNamespace(role=Role.ADMIN)
    cache = FakeCache()
    service = OrganizationService(repo, cache=cache)

    first_role = await service.get_user_role(7, "user-1")
    second_role = await service.get_user_role(7, "user-1")

    assert first_role == Role.ADMIN
    assert second_role == Role.ADMIN
    assert repo.get_member_calls == 1
    assert cache.values["org_role:7:user-1"] == {"role": "admin"}


async def test_get_user_role_caches_missing_membership() -> None:
    repo = FakeOrganizationRepository()
    cache = FakeCache()
    service = OrganizationService(repo, cache=cache)

    first_role = await service.get_user_role(8, "missing-user")
    second_role = await service.get_user_role(8, "missing-user")

    assert first_role is None
    assert second_role is None
    assert repo.get_member_calls == 1
    assert cache.values["org_role:8:missing-user"] == {"role": None}


async def test_add_member_invalidates_cached_role() -> None:
    repo = FakeOrganizationRepository()
    cache = FakeCache()
    cache.values["org_role:11:new-user"] = {"role": "member"}
    service = OrganizationService(repo, cache=cache)

    member = await service.add_member(11, "new-user", "new@example.com", Role.ADMIN)

    assert member.role == Role.ADMIN
    assert "org_role:11:new-user" in cache.deleted_keys


async def test_update_member_role_invalidates_cached_role() -> None:
    repo = FakeOrganizationRepository()
    repo.members[(12, "member-1")] = SimpleNamespace(role=Role.MEMBER)
    cache = FakeCache()
    service = OrganizationService(repo, cache=cache)

    updated = await service.update_member_role(12, "member-1", Role.ADMIN)

    assert updated.role == Role.ADMIN
    assert "org_role:12:member-1" in cache.deleted_keys


async def test_remove_member_invalidates_cached_role() -> None:
    repo = FakeOrganizationRepository()
    repo.members[(13, "member-2")] = SimpleNamespace(role=Role.MEMBER)
    cache = FakeCache()
    service = OrganizationService(repo, cache=cache)

    removed = await service.remove_member(13, "member-2")

    assert removed is True
    assert "org_role:13:member-2" in cache.deleted_keys


async def test_delete_organization_invalidates_cached_org_namespace() -> None:
    repo = FakeOrganizationRepository()
    cache = FakeCache()
    cache.values["org_role:21:user-1"] = {"role": "owner"}
    cache.values["org_role:21:user-2"] = {"role": "member"}
    service = OrganizationService(repo, cache=cache)

    deleted = await service.delete_organization(21)

    assert deleted is True
    assert cache.deleted_prefixes == ["org_role:21:"]
    assert cache.values == {}


async def test_service_behaves_normally_when_cache_is_disabled() -> None:
    repo = FakeOrganizationRepository()
    repo.members[(34, "user-2")] = SimpleNamespace(role=Role.OWNER)
    service = OrganizationService(repo, cache=None)

    role = await service.get_user_role(34, "user-2")

    assert role == Role.OWNER
    assert repo.get_member_calls == 1


async def test_cache_service_disables_itself_after_redis_failure() -> None:
    cache = CacheService(
        enabled=True,
        backend="redis",
        default_ttl_seconds=300,
        redis_url="redis://localhost:6379/0",
    )
    cache._client = FailingRedisClient()

    value = await cache.get_json("org_role:1:user-1")

    assert value is None
    assert cache.is_enabled() is False
