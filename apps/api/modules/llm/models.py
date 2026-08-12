"""SQLAlchemy model for LLM model pricing catalogue."""

from datetime import datetime
from typing import ClassVar, Optional

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from apps.api.core.database.base import Base


class LLMModel(Base):
    """Tracks known LLM models and their per-token pricing on OpenRouter."""

    __tablename__ = "llm_models"

    # Override Base's auto-integer PK — this table uses model_id as string PK
    id: ClassVar[None] = None  # type: ignore[assignment]
    created_at: ClassVar[None] = None  # type: ignore[assignment]
    updated_at: ClassVar[None] = None  # type: ignore[assignment]

    # OpenRouter model slug (primary key)
    model_id: Mapped[str] = mapped_column(String(128), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(128), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)

    # USD price per 1 million tokens
    input_price_per_1m: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False, default=0)
    output_price_per_1m: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False, default=0)

    supports_vision: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    context_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    updated_at_col: Mapped[datetime] = mapped_column(
        "updated_at",
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
