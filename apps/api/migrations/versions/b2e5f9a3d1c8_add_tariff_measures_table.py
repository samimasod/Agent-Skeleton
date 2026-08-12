"""add_tariff_measures_table

Revision ID: b2e5f9a3d1c8
Revises: a1d4f8c2b3e7
Create Date: 2026-04-16

Creates the tariff_measures table — a generic, country-neutral store for all
duty/tax measures (customs_duty, igst, vat, anti_dumping_duty, etc.).

One row = one measure for one HS code in one jurisdiction.
Preferential / FTA rates are stored as separate rows with origin_country_code set.

Design rationale:
  - Keeps hs_codes as a pure classification hierarchy (no tax columns)
  - Any number of measure types per jurisdiction without schema changes
  - Validity windows (effective_from / effective_to) for temporal accuracy
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b2e5f9a3d1c8'
down_revision: Union[str, None] = 'a1d4f8c2b3e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'tariff_measures',

        # ── Primary key (from Base) ──────────────────────────────────────────
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),

        # ── HS Code reference ────────────────────────────────────────────────
        sa.Column('hs_code_id', sa.Integer(), nullable=True),
        sa.Column('hscode', sa.String(length=20), nullable=False),

        # ── Jurisdiction ─────────────────────────────────────────────────────
        sa.Column('jurisdiction_code', sa.String(length=4), nullable=False),

        # ── Measure classification ───────────────────────────────────────────
        sa.Column('measure_type', sa.String(length=64), nullable=False),
        sa.Column('rate_type', sa.String(length=32), nullable=False),

        # ── Rate details ─────────────────────────────────────────────────────
        sa.Column('rate_value', sa.Numeric(precision=12, scale=4), nullable=True),
        sa.Column('currency', sa.String(length=8), nullable=True),
        sa.Column('unit', sa.String(length=32), nullable=True),

        # ── Origin & agreement ───────────────────────────────────────────────
        sa.Column('origin_country_code', sa.String(length=4), nullable=True),
        sa.Column('agreement_code', sa.String(length=64), nullable=True),
        sa.Column('condition_text', sa.Text(), nullable=True),

        # ── Validity window ──────────────────────────────────────────────────
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_to', sa.Date(), nullable=True),

        # ── Provenance ───────────────────────────────────────────────────────
        sa.Column('source', sa.String(length=256), nullable=True),

        # ── Constraints ─────────────────────────────────────────────────────
        sa.ForeignKeyConstraint(
            ['hs_code_id'],
            ['hs_codes.id'],
            name='fk_tariff_measures_hs_code_id',
            ondelete='SET NULL',
        ),
        sa.PrimaryKeyConstraint('id', name='pk_tariff_measures'),
    )

    # ── Indexes ───────────────────────────────────────────────────────────────
    op.create_index('ix_tariff_measures_hs_code_id', 'tariff_measures', ['hs_code_id'])
    op.create_index('ix_tariff_measures_hscode', 'tariff_measures', ['hscode'])
    op.create_index('ix_tariff_measures_jurisdiction_code', 'tariff_measures', ['jurisdiction_code'])
    op.create_index('ix_tariff_measures_measure_type', 'tariff_measures', ['measure_type'])
    op.create_index('ix_tariff_measures_origin', 'tariff_measures', ['origin_country_code'])
    op.create_index(
        'ix_tariff_hscode_jurisdiction',
        'tariff_measures',
        ['hscode', 'jurisdiction_code'],
    )
    op.create_index(
        'ix_tariff_jurisdiction_type',
        'tariff_measures',
        ['jurisdiction_code', 'measure_type'],
    )
    op.create_index(
        'ix_tariff_effective',
        'tariff_measures',
        ['effective_from', 'effective_to'],
    )


def downgrade() -> None:
    op.drop_index('ix_tariff_effective', table_name='tariff_measures')
    op.drop_index('ix_tariff_jurisdiction_type', table_name='tariff_measures')
    op.drop_index('ix_tariff_hscode_jurisdiction', table_name='tariff_measures')
    op.drop_index('ix_tariff_measures_origin', table_name='tariff_measures')
    op.drop_index('ix_tariff_measures_measure_type', table_name='tariff_measures')
    op.drop_index('ix_tariff_measures_jurisdiction_code', table_name='tariff_measures')
    op.drop_index('ix_tariff_measures_hscode', table_name='tariff_measures')
    op.drop_index('ix_tariff_measures_hs_code_id', table_name='tariff_measures')
    op.drop_table('tariff_measures')
