"""
Shared LLM client configuration.
Supports OpenAI directly or OpenRouter's OpenAI-compatible API.
"""
from typing import Optional

from openai import AsyncOpenAI

from apps.api.config import settings


def create_async_client(api_key: Optional[str] = None) -> AsyncOpenAI:
    """Create an async LLM client for the configured provider."""
    resolved_api_key = api_key or settings.llm_api_key
    if not resolved_api_key:
        raise ValueError("No LLM API key is configured for the active provider")

    provider = settings.llm_provider.lower()
    if provider == "openai":
        return AsyncOpenAI(api_key=resolved_api_key)

    return AsyncOpenAI(
        api_key=resolved_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Skeleton",
        },
    )
