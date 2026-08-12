"""Schemas for LLM routes."""

from pydantic import BaseModel


class LLMModelResponse(BaseModel):
    model_id: str
    display_name: str
    provider: str
    input_price_per_1m: float
    output_price_per_1m: float
    supports_vision: bool
    context_tokens: int
