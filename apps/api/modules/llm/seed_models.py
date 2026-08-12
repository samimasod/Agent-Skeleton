"""
Seed the llm_models table with popular OpenRouter models and their current pricing.
Prices are in USD per 1 million tokens (input / output).
Sources: https://openrouter.ai/models (as of Apr 2026)

Run via: python -m apps.api.modules.llm.seed_models
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# fmt: off
MODELS: list[dict[str, Any]] = [
    # ── OpenAI (The Standard) ────────────────────────────────────────────────
    {
        "model_id": "openai/gpt-5.4-pro",
        "display_name": "GPT-5.4 Pro",
        "provider": "OpenAI",
        "input_price_per_1m": 15.00,
        "output_price_per_1m": 120.00,
        "supports_vision": True,
        "context_tokens": 400_000,
        "notes": "State-of-the-art reasoning and deep research capability",
    },
    {
        "model_id": "openai/gpt-5.4",
        "display_name": "GPT-5.4",
        "provider": "OpenAI",
        "input_price_per_1m": 2.50,
        "output_price_per_1m": 15.00,
        "supports_vision": True,
        "context_tokens": 1_000_000,
        "notes": "Unified flagship; supports native computer use",
    },
    {
        "model_id": "openai/gpt-5.4-mini",
        "display_name": "GPT-5.4 Mini",
        "provider": "OpenAI",
        "input_price_per_1m": 0.15,
        "output_price_per_1m": 0.60,
        "supports_vision": True,
        "context_tokens": 128_000,
    },
    {
        "model_id": "openai/o4-mini",
        "display_name": "o4 Mini",
        "provider": "OpenAI",
        "input_price_per_1m": 1.10,
        "output_price_per_1m": 4.40,
        "supports_vision": True,
        "context_tokens": 200_000,
        "notes": "Fast reasoning model for logic-heavy tasks",
    },

    # ── Anthropic (The Coding Specialist) ─────────────────────────────────────
    {
        "model_id": "anthropic/claude-4.6-opus",
        "display_name": "Claude 4.6 Opus",
        "provider": "Anthropic",
        "input_price_per_1m": 5.00,
        "output_price_per_1m": 25.00,
        "supports_vision": True,
        "context_tokens": 1_000_000,
        "notes": "The frontier for complex software engineering",
    },
    {
        "model_id": "anthropic/claude-4.6-sonnet",
        "display_name": "Claude 4.6 Sonnet",
        "provider": "Anthropic",
        "input_price_per_1m": 3.00,
        "output_price_per_1m": 15.00,
        "supports_vision": True,
        "context_tokens": 1_000_000,
        "notes": "1M context; best-in-class agentic planning",
    },
    {
        "model_id": "anthropic/claude-4.5-haiku",
        "display_name": "Claude 4.5 Haiku",
        "provider": "Anthropic",
        "input_price_per_1m": 1.00,
        "output_price_per_1m": 5.00,
        "supports_vision": True,
        "context_tokens": 200_000,
    },

    # ── Google (The Context King) ─────────────────────────────────────────────
    {
        "model_id": "google/gemini-3.1-pro",
        "display_name": "Gemini 3.1 Pro",
        "provider": "Google",
        "input_price_per_1m": 2.00,
        "output_price_per_1m": 12.00,
        "supports_vision": True,
        "context_tokens": 1_048_576,
    },
    {
        "model_id": "google/gemini-3.1-flash",
        "display_name": "Gemini 3.1 Flash",
        "provider": "Google",
        "input_price_per_1m": 0.90,
        "output_price_per_1m": 2.70,
        "supports_vision": True,
        "context_tokens": 1_048_576,
    },
    {
        "model_id": "google/gemini-3.1-flash-lite",
        "display_name": "Gemini 3.1 Flash Lite",
        "provider": "Google",
        "input_price_per_1m": 0.25,
        "output_price_per_1m": 1.50,
        "supports_vision": True,
        "context_tokens": 1_000_000,
    },
    {
        "model_id": "google/gemini-3.1-flash-lite-preview",
        "display_name": "Gemini 3.1 Flash Lite Preview",
        "provider": "Google",
        "input_price_per_1m": 0.25,
        "output_price_per_1m": 1.50,
        "supports_vision": True,
        "context_tokens": 1_000_000,
    },
    {
        "model_id": "google/gemini-3.1-pro-preview",
        "display_name": "Gemini 3.1 Pro Preview",
        "provider": "Google",
        "input_price_per_1m": 2.00,
        "output_price_per_1m": 12.00,
        "supports_vision": True,
        "context_tokens": 1_048_576,
    },

    # ── DeepSeek (The Value King) ─────────────────────────────────────────────
    {
        "model_id": "deepseek/deepseek-r1",
        "display_name": "DeepSeek R1",
        "provider": "DeepSeek",
        "input_price_per_1m": 0.55,
        "output_price_per_1m": 2.19,
        "supports_vision": False,
        "context_tokens": 128_000,
        "notes": "Deep reasoning at 96% lower cost than OpenAI o1",
    },
    {
        "model_id": "deepseek/deepseek-v4",
        "display_name": "DeepSeek V4",
        "provider": "DeepSeek",
        "input_price_per_1m": 0.30,
        "output_price_per_1m": 0.50,
        "supports_vision": True,
        "context_tokens": 1_000_000,
    },
    {
        "model_id": "deepseek/deepseek-chat-v3.2",
        "display_name": "DeepSeek Chat V3.2",
        "provider": "DeepSeek",
        "input_price_per_1m": 0.28,
        "output_price_per_1m": 0.42,
        "supports_vision": False,
        "context_tokens": 128_000,
    },

    # ── Meta (The Open Weights Leader) ────────────────────────────────────────
    {
        "model_id": "meta-llama/llama-4-maverick",
        "display_name": "Llama 4 Maverick (400B)",
        "provider": "Meta",
        "input_price_per_1m": 0.20,
        "output_price_per_1m": 0.60,
        "supports_vision": True,
        "context_tokens": 1_000_000,
        "notes": "Native multimodal with 128 experts (MoE)",
    },
    {
        "model_id": "meta-llama/llama-4-scout",
        "display_name": "Llama 4 Scout",
        "provider": "Meta",
        "input_price_per_1m": 0.10,
        "output_price_per_1m": 0.30,
        "supports_vision": True,
        "context_tokens": 512_000,
    },

    # ── Mistral & Open-Source "Nano" ──────────────────────────────────────────
    {
        "model_id": "mistralai/mistral-large-3",
        "display_name": "Mistral Large 3",
        "provider": "Mistral",
        "input_price_per_1m": 0.50,
        "output_price_per_1m": 1.50,
        "supports_vision": True,
        "context_tokens": 262_144,
    },
    {
        "model_id": "mistralai/devstral-2",
        "display_name": "Devstral 2 (123B)",
        "provider": "Mistral",
        "input_price_per_1m": 0.05,
        "output_price_per_1m": 0.22,
        "supports_vision": False,
        "context_tokens": 256_000,
        "notes": "Agentic coding specialist; extreme cost efficiency",
    },
    {
        "model_id": "xiaomi/mimo-v2-flash",
        "display_name": "Xiaomi MiMo V2",
        "provider": "Xiaomi",
        "input_price_per_1m": 0.00,
        "output_price_per_1m": 0.00,
        "supports_vision": True,
        "context_tokens": 256_000,
        "notes": "Leading free model on OpenRouter; 309B MoE",
    },
    {
        "model_id": "nvidia/nemotron-3-nano",
        "display_name": "Nemotron 3 Nano",
        "provider": "NVIDIA",
        "input_price_per_1m": 0.00,
        "output_price_per_1m": 0.00,
        "supports_vision": False,
        "context_tokens": 32_000,
        "notes": "Free tier; best for high-volume summarization",
    },
]
# fmt: on


async def seed_llm_models(session) -> int:
    """
    Insert any missing models into llm_models.
    Returns number of rows newly inserted.
    """
    from sqlalchemy import select
    from apps.api.modules.llm.models import LLMModel

    # Fetch currently existing models
    result = await session.execute(select(LLMModel.model_id))
    existing_model_ids = set(result.scalars().all())

    inserted_count = 0
    for m in MODELS:
        if m["model_id"] not in existing_model_ids:
            session.add(
                LLMModel(
                    model_id=m["model_id"],
                    display_name=m["display_name"],
                    provider=m["provider"],
                    input_price_per_1m=m["input_price_per_1m"],
                    output_price_per_1m=m["output_price_per_1m"],
                    supports_vision=m.get("supports_vision", False),
                    context_tokens=m.get("context_tokens"),
                    notes=m.get("notes"),
                    is_active=True,
                )
            )
            inserted_count += 1

    if inserted_count > 0:
        await session.commit()
        logger.info("Seeded %d newly added LLM models into llm_models table.", inserted_count)
    return inserted_count
