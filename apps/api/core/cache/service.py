"""Reusable cache service backed by Redis."""
from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any, Optional

from redis.asyncio import Redis

from apps.api.config import settings

logger = logging.getLogger(__name__)


class CacheKeys:
    """Cache key helpers for shared namespaces."""

    @staticmethod
    def org_role(org_id: int, firebase_uid: str) -> str:
        return f"org_role:{org_id}:{firebase_uid}"

    @staticmethod
    def org_role_prefix(org_id: int) -> str:
        return f"org_role:{org_id}:"

    @staticmethod
    def available_credits(subject: str) -> str:
        return f"available_credits:{subject}"


class CacheService:
    """Thin cache abstraction with Redis-first behavior."""

    def __init__(
        self,
        *,
        enabled: bool,
        backend: str,
        default_ttl_seconds: int,
        redis_url: Optional[str] = None,
    ) -> None:
        self.enabled = enabled and backend.lower() == "redis" and bool(redis_url)
        self.backend = backend
        self.default_ttl_seconds = default_ttl_seconds
        self.redis_url = redis_url
        self._client: Optional[Redis] = None
        self._disabled_due_to_error = False

    def is_enabled(self) -> bool:
        return self.enabled and not self._disabled_due_to_error

    def _client_or_none(self) -> Optional[Redis]:
        if not self.is_enabled():
            return None
        if self._client is None and self.redis_url:
            self._client = Redis.from_url(self.redis_url, decode_responses=True)
        return self._client

    def _handle_error(self, action: str, error: Exception) -> None:
        logger.warning("Cache %s failed: %s", action, error)
        self._disabled_due_to_error = True

    async def get_json(self, key: str) -> Optional[dict[str, Any]]:
        client = self._client_or_none()
        if client is None:
            return None
        try:
            value = await client.get(key)
        except Exception as exc:
            self._handle_error("get", exc)
            return None
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return None

    async def set_json(
        self,
        key: str,
        value: dict[str, Any],
        ttl_seconds: Optional[int] = None,
    ) -> None:
        client = self._client_or_none()
        if client is None:
            return
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds
        try:
            await client.set(key, json.dumps(value), ex=ttl)
        except Exception as exc:
            self._handle_error("set", exc)

    async def delete(self, key: str) -> None:
        client = self._client_or_none()
        if client is None:
            return
        try:
            await client.delete(key)
        except Exception as exc:
            self._handle_error("delete", exc)

    async def delete_prefix(self, prefix: str) -> None:
        client = self._client_or_none()
        if client is None:
            return
        try:
            cursor = 0
            pattern = f"{prefix}*"
            while True:
                cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
                if keys:
                    await client.delete(*keys)
                if cursor == 0:
                    break
        except Exception as exc:
            self._handle_error("delete_prefix", exc)


@lru_cache()
def get_cache_service() -> CacheService:
    return CacheService(
        enabled=settings.cache_enabled,
        backend=settings.cache_backend,
        default_ttl_seconds=settings.cache_default_ttl_seconds,
        redis_url=settings.redis_url,
    )
