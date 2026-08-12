"""add_ui_mode_and_display_labels_to_agent_tools

Revision ID: 4d416d87fb32
Revises: 8dcc8860532e
Create Date: 2026-08-08 18:57:18.004784

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4d416d87fb32'
down_revision: Union[str, None] = '8dcc8860532e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('agent_tools', schema=None) as batch_op:
        batch_op.add_column(sa.Column('ui_mode', sa.String(length=32), server_default='inline', nullable=False))
        batch_op.add_column(sa.Column('display_label_running', sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column('display_label_completed', sa.String(length=120), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('agent_tools', schema=None) as batch_op:
        batch_op.drop_column('display_label_completed')
        batch_op.drop_column('display_label_running')
        batch_op.drop_column('ui_mode')

