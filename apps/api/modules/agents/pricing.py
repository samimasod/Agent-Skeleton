"""
Model pricing rate card and config-driven token extraction utilities for AI Agent telemetry.
"""

from typing import Any, Dict, Optional, Tuple
import logging

logger = logging.getLogger("agent-pricing")

# Model pricing matrix in USD per 1,000,000 tokens (Input, Output)
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    # OpenAI Models
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-2024-08-06": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "o1": {"input": 15.00, "output": 60.00},
    "o1-mini": {"input": 3.00, "output": 12.00},
    "o3-mini": {"input": 1.10, "output": 4.40},

    # Anthropic Models
    "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
    "claude-3-5-haiku": {"input": 0.80, "output": 4.00},
    "claude-3-opus": {"input": 15.00, "output": 75.00},

    # Google Gemini Models
    "gemini-2.0-flash": {"input": 0.10, "output": 0.40},
    "gemini-2.0-flash-lite": {"input": 0.075, "output": 0.30},
    "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},

    # DeepSeek & Llama Models
    "deepseek-r1": {"input": 0.55, "output": 2.19},
    "deepseek-v3": {"input": 0.14, "output": 0.28},
    "llama-3.3-70b": {"input": 0.40, "output": 0.40},

    # Default Fallback for Unlisted Models
    "default": {"input": 1.00, "output": 3.00},
}


def normalize_model_slug(model_id: str) -> str:
    """Normalize model slugs across gateways and providers into standard family keys."""
    if not model_id:
        return "default"
    
    slug = model_id.lower().strip()
    
    # Strip vendor prefix if present (e.g., 'openai/gpt-4o' -> 'gpt-4o', 'google/gemini-2.0-flash' -> 'gemini-2.0-flash')
    if "/" in slug:
        parts = slug.split("/")
        slug = parts[-1]
    if ":" in slug:
        slug = slug.split(":")[0]

    norm_slug = slug.replace(".", "-")
    for known_key in MODEL_PRICING:
        norm_key = known_key.replace(".", "-")
        if known_key != "default" and norm_key in norm_slug:
            return known_key

    return "default"


def calculate_turn_cost(
    model_id: str, prompt_tokens: int, completion_tokens: int
) -> float:
    """Calculate estimated cost in USD for a given completion turn."""
    normalized_key = normalize_model_slug(model_id)
    rates = MODEL_PRICING.get(normalized_key, MODEL_PRICING["default"])

    input_cost = (prompt_tokens / 1_000_000.0) * rates["input"]
    output_cost = (completion_tokens / 1_000_000.0) * rates["output"]

    return round(input_cost + output_cost, 6)


class TokenExtractor:
    """Config-driven token extractor supporting OpenRouter, OpenAI, Anthropic, Gemini, Azure, and Heuristic Fallbacks."""

    @staticmethod
    def extract(
        provider: str,
        usage_payload: Any = None,
        input_text: str = "",
        output_text: str = "",
    ) -> Tuple[int, int, int]:
        """
        Extract (prompt_tokens, completion_tokens, total_tokens) based on active provider config.
        Falls back to fast heuristic character estimation if provider usage payload is missing/truncated.
        """
        prompt_tokens = 0
        completion_tokens = 0

        provider_name = (provider or "openrouter").lower().strip()

        try:
            if usage_payload is not None:
                # Case A: Dictionary payload (OpenRouter, raw JSON dicts, Ollama)
                if isinstance(usage_payload, dict):
                    prompt_tokens = (
                        usage_payload.get("prompt_tokens")
                        or usage_payload.get("input_tokens")
                        or usage_payload.get("prompt_eval_count")
                        or 0
                    )
                    completion_tokens = (
                        usage_payload.get("completion_tokens")
                        or usage_payload.get("output_tokens")
                        or usage_payload.get("eval_count")
                        or 0
                    )
                # Case B: Pydantic / Object payload (OpenAI, Azure, Anthropic object)
                else:
                    prompt_tokens = getattr(
                        usage_payload,
                        "prompt_tokens",
                        getattr(usage_payload, "input_tokens", 0),
                    )
                    completion_tokens = getattr(
                        usage_payload,
                        "completion_tokens",
                        getattr(usage_payload, "output_tokens", 0),
                    )

                    # Gemini usage_metadata handling
                    if not prompt_tokens and hasattr(usage_payload, "prompt_token_count"):
                        prompt_tokens = getattr(usage_payload, "prompt_token_count", 0)
                        completion_tokens = getattr(usage_payload, "candidates_token_count", 0)

        except Exception as err:
            logger.warning(f"Error parsing token usage for provider '{provider_name}': {err}")

        # Level 2 Heuristic Fallback if token values are 0 or missing
        if prompt_tokens <= 0 and input_text:
            prompt_tokens = max(1, len(input_text) // 4)
        if completion_tokens <= 0 and output_text:
            completion_tokens = max(1, len(output_text) // 4)

        total_tokens = prompt_tokens + completion_tokens
        return prompt_tokens, completion_tokens, total_tokens
