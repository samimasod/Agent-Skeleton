"""
Project database models.
"""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.core.database.base import Base

if TYPE_CHECKING:
    from apps.api.modules.organizations.models import Organization


class Project(Base):
    """Project model representing a reusable workspace container."""

    __tablename__ = "projects"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    auth_config: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="projects",
    )
