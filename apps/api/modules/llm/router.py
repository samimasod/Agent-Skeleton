"""LLM module public routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import get_db
from apps.api.core.security.firebase_auth import FirebaseUser, get_current_user
from apps.api.modules.llm.models import LLMModel
from apps.api.modules.llm.schemas import LLMModelResponse

router = APIRouter()


@router.get("/models", response_model=list[LLMModelResponse])
async def list_llm_models(
    _: FirebaseUser = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """List all available LLM models with their pricing."""
    result = await session.execute(
        select(LLMModel).where(LLMModel.is_active == True).order_by(LLMModel.provider, LLMModel.display_name)
    )
    models = result.scalars().all()
    response_list = [
        {
            "model_id": m.model_id,
            "display_name": m.display_name,
            "provider": m.provider,
            "input_price_per_1m": float(m.input_price_per_1m),
            "output_price_per_1m": float(m.output_price_per_1m),
            "supports_vision": m.supports_vision,
            "context_tokens": m.context_tokens,
        }
        for m in models
    ]
    response_list.append({
        "model_id": "test/mock-model",
        "display_name": "Local Simulated Mock Sandbox (Free)",
        "provider": "Mock Sandbox",
        "input_price_per_1m": 0.0,
        "output_price_per_1m": 0.0,
        "supports_vision": False,
        "context_tokens": 8192,
    })
    return response_list
