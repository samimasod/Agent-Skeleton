"""
Organization database models.
"""
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.api.core.database.base import Base
from apps.api.core.security.permissions import Role

if TYPE_CHECKING:
    from apps.api.modules.projects.models import Project


class Organization(Base):
    """Organization model representing a company or team."""

    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    members: Mapped[List["OrganizationMember"]] = relationship(
        "OrganizationMember",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    invitations: Mapped[List["OrganizationInvitation"]] = relationship(
        "OrganizationInvitation",
        back_populates="organization",
        cascade="all, delete-orphan",
    )
    projects: Mapped[List["Project"]] = relationship(
        "Project",
        back_populates="organization",
        cascade="all, delete-orphan",
    )


class OrganizationMember(Base):
    """Organization membership linking users to organizations with roles."""

    __tablename__ = "organization_members"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    firebase_uid: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
        SQLEnum(Role),
        default=Role.MEMBER,
        nullable=False,
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="members",
    )


class InvitationStatus(str, Enum):
    """Lifecycle state for organization invitations."""

    PENDING = "pending"
    ACCEPTED = "accepted"


class OrganizationInvitation(Base):
    """Pending invitation for a user to join an organization."""

    __tablename__ = "organization_invitations"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[Role] = mapped_column(
        SQLEnum(Role),
        default=Role.MEMBER,
        nullable=False,
    )
    status: Mapped[InvitationStatus] = mapped_column(
        SQLEnum(InvitationStatus),
        default=InvitationStatus.PENDING,
        nullable=False,
    )
    invited_by_uid: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="invitations",
    )
