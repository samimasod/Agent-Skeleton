"""add_require_approval_and_audit_to_agent_tools

Revision ID: b69ac38f9b68
Revises: f6ede7af2312
Create Date: 2026-08-11 17:12:41.259373

Adds Human-in-the-Loop approval gate fields to agent_tools and
audit trail columns to agent_tool_runs.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b69ac38f9b68'
down_revision: Union[str, None] = 'f6ede7af2312'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add approval audit columns to agent_tool_runs
    with op.batch_alter_table('agent_tool_runs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('approval_status', sa.String(length=16), nullable=True))
        batch_op.add_column(sa.Column('approved_by', sa.String(length=128), nullable=True))

    # Add require_approval gate fields to agent_tools
    with op.batch_alter_table('agent_tools', schema=None) as batch_op:
        batch_op.add_column(sa.Column('require_approval', sa.Boolean(), nullable=False, server_default=sa.text('0')))
        batch_op.add_column(sa.Column('approval_required_for_roles', sa.JSON(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('agent_tools', schema=None) as batch_op:
        batch_op.drop_column('approval_required_for_roles')
        batch_op.drop_column('require_approval')

    with op.batch_alter_table('agent_tool_runs', schema=None) as batch_op:
        batch_op.drop_column('approved_by')
        batch_op.drop_column('approval_status')
