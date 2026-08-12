#!/usr/bin/env python3
"""Seed a shared local test organization and memberships for Firebase test users."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROFILE_ENV_PREFIXES = {
    "owner": "TEST_AUTH_OWNER",
    "admin": "TEST_AUTH_ADMIN",
    "member": "TEST_AUTH_MEMBER",
    "outsider": "TEST_AUTH_OUTSIDER",
}


def load_local_env() -> None:
    root = Path(__file__).resolve().parent.parent
    load_env_file(root / ".env", override=False)
    load_env_file(root / ".env.local", override=True)


def load_env_file(path: Path, override: bool) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if override or key not in os.environ:
            os.environ[key] = value


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise SystemExit(f"Missing required environment variable: {name}")


def get_profile_credentials(profile: str) -> tuple[str | None, str | None]:
    prefix = PROFILE_ENV_PREFIXES[profile]
    return os.getenv(f"{prefix}_EMAIL"), os.getenv(f"{prefix}_PASSWORD")


def sign_in_user(api_key: str, email: str, password: str) -> dict:
    request = Request(
        url=(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?"
            + urlencode({"key": api_key})
        ),
        data=json.dumps(
            {
                "email": email,
                "password": password,
                "returnSecureToken": True,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise SystemExit(f"Firebase sign-in failed for {email}: {detail}") from exc
    except URLError as exc:
        raise SystemExit(f"Could not reach Firebase auth endpoint: {exc}") from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Seed a shared organization for configured Firebase test users.",
    )
    parser.add_argument(
        "--org-name",
        default=os.getenv("TEST_ORG_NAME", "Skeleton Test Org"),
        help="Organization name to create or reuse.",
    )
    parser.add_argument(
        "--org-slug",
        default=os.getenv("TEST_ORG_SLUG", "skeleton-test-org"),
        help="Organization slug to create or reuse.",
    )
    return parser.parse_args()


async def seed_org(org_name: str, org_slug: str) -> None:
    from apps.api.modules.organizations.models import InvitationStatus
    from apps.api.core.security.permissions import Role
    from apps.api.core.database.connection import AsyncSessionLocal, init_db
    from apps.api.modules.organizations.repository import OrganizationRepository
    from apps.api.modules.organizations.schemas import OrganizationCreate
    from apps.api.modules.organizations.service import OrganizationService

    api_key = require_env("FIREBASE_API_KEY")
    owner_email, owner_password = get_profile_credentials("owner")
    if not owner_email or not owner_password:
        raise SystemExit("Owner test profile is required to seed the organization.")

    owner_email = owner_email.lower()
    owner_auth = sign_in_user(api_key, owner_email, owner_password)
    owner_uid = owner_auth["localId"]

    member_profiles = [
        ("owner", Role.OWNER),
        ("admin", Role.ADMIN),
        ("member", Role.MEMBER),
    ]

    await init_db()

    async with AsyncSessionLocal() as session:
        repository = OrganizationRepository(session)
        service = OrganizationService(repository)

        org = await repository.get_by_slug(org_slug)
        if org is None:
            org = await service.create_organization(
                OrganizationCreate(name=org_name, slug=org_slug),
                owner_uid=owner_uid,
                owner_email=owner_email,
            )
            await session.flush()
        else:
            owner_member = await repository.get_member(org.id, owner_uid)
            if owner_member is None:
                existing_owner_by_email = await repository.get_member_by_email(org.id, owner_email)
                if existing_owner_by_email is not None:
                    existing_owner_by_email.firebase_uid = owner_uid
                    existing_owner_by_email.role = Role.OWNER
                    await session.flush()
                else:
                    await service.add_member(org.id, owner_uid, owner_email, Role.OWNER)

        for profile, role in member_profiles[1:]:
            email, password = get_profile_credentials(profile)
            if not email or not password:
                continue

            email = email.lower()
            auth_payload = sign_in_user(api_key, email, password)
            firebase_uid = auth_payload["localId"]

            member = await repository.get_member(org.id, firebase_uid)
            if member is not None:
                member.role = role
                continue

            member_by_email = await repository.get_member_by_email(org.id, email)
            if member_by_email is not None:
                member_by_email.firebase_uid = firebase_uid
                member_by_email.role = role
                continue

            await service.add_member(org.id, firebase_uid, email, role)

        await session.refresh(org, attribute_names=["invitations"])
        pending_invites = [
            invite for invite in org.invitations
            if invite.status == InvitationStatus.PENDING
        ]

        for invite in pending_invites:
            email = invite.email.lower()
            for profile, role in member_profiles:
                profile_email, _ = get_profile_credentials(profile)
                if profile_email and profile_email.lower() == email:
                    invite.status = InvitationStatus.ACCEPTED
                    invite.role = role
                    break

        await session.commit()

        print(f"Seeded organization '{org.name}' ({org.slug})")
        print(f"Owner: {owner_email}")
        for profile, role in member_profiles[1:]:
            email, _ = get_profile_credentials(profile)
            if email:
                print(f"{profile.capitalize()}: {email.lower()} as {role.value}")


def main() -> int:
    load_local_env()
    args = parse_args()

    import asyncio

    asyncio.run(seed_org(args.org_name, args.org_slug))
    return 0


if __name__ == "__main__":
    sys.exit(main())