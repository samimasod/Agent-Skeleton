"""add_country_columns_to_hs_codes

Revision ID: a1d4f8c2b3e7
Revises: ca65e24a09c6
Create Date: 2026-04-16

Extends the unified hs_codes table to support country-specific 8-digit+ national
extensions (e.g. India ITC-HS 8-digit, US HTS 10-digit) alongside the existing
WCO 6-digit global standard codes.

Changes:
  - hscode / parent_hscode  : String(16) → String(20)  (to fit 10-digit US HTS codes)
  - country_code            : String(4)  nullable  (NULL = global; "IN", "US", etc.)
  - is_national             : Boolean    non-null   (True for 8-digit+ country rows)
  - Drop old single-column UNIQUE on hscode  (PostgreSQL auto-name: hs_codes_hscode_key)
  - Create partial unique index for global codes   WHERE country_code IS NULL
  - Create partial unique index for national codes WHERE country_code IS NOT NULL
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1d4f8c2b3e7'
down_revision: Union[str, None] = 'ca65e24a09c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Widen hscode and parent_hscode to accommodate 10-digit national codes
    op.alter_column(
        'hs_codes', 'hscode',
        existing_type=sa.String(length=16),
        type_=sa.String(length=20),
        existing_nullable=False,
    )
    op.alter_column(
        'hs_codes', 'parent_hscode',
        existing_type=sa.String(length=16),
        type_=sa.String(length=20),
        existing_nullable=True,
    )

    # 2. Add country extension columns
    op.add_column('hs_codes', sa.Column('country_code', sa.String(length=4), nullable=True))
    op.add_column(
        'hs_codes',
        sa.Column('is_national', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    )
    op.create_index('ix_hs_codes_country_code', 'hs_codes', ['country_code'], unique=False)

    # 3. Drop the old single-column unique constraint on hscode.
    #    The constraint was created via Base.metadata.create_all() (no Alembic naming convention),
    #    so PostgreSQL auto-named it.  We use a DO block to discover and drop it dynamically
    #    so the migration succeeds regardless of the exact constraint name.
    op.execute(sa.text("""
        DO $$
        DECLARE
            _conname TEXT;
        BEGIN
            SELECT conname INTO _conname
            FROM pg_constraint
            WHERE conrelid = 'hs_codes'::regclass
              AND contype   = 'u'
              AND cardinality(conkey) = 1
              AND conkey[1] = (
                  SELECT attnum FROM pg_attribute
                  WHERE attrelid = 'hs_codes'::regclass AND attname = 'hscode'
              );

            IF _conname IS NOT NULL THEN
                EXECUTE format('ALTER TABLE hs_codes DROP CONSTRAINT %I', _conname);
            END IF;
        END $$;
    """))

    # 4. Replace with two partial unique indexes:
    #    - Global codes  : unique by hscode alone            WHERE country_code IS NULL
    #    - National codes: unique by (hscode, country_code)  WHERE country_code IS NOT NULL
    op.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_hs_codes_global "
        "ON hs_codes (hscode) WHERE country_code IS NULL"
    ))
    op.execute(sa.text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_hs_codes_national "
        "ON hs_codes (hscode, country_code) WHERE country_code IS NOT NULL"
    ))



def downgrade() -> None:
    # Drop partial indexes
    op.execute("DROP INDEX IF EXISTS uq_hs_codes_national")
    op.execute("DROP INDEX IF EXISTS uq_hs_codes_global")

    # Restore original single-column unique constraint
    op.create_unique_constraint('hs_codes_hscode_key', 'hs_codes', ['hscode'])

    # Remove country columns
    op.drop_index('ix_hs_codes_country_code', table_name='hs_codes')
    op.drop_column('hs_codes', 'is_national')
    op.drop_column('hs_codes', 'country_code')

    # Restore original column widths
    op.alter_column(
        'hs_codes', 'parent_hscode',
        existing_type=sa.String(length=20),
        type_=sa.String(length=16),
        existing_nullable=True,
    )
    op.alter_column(
        'hs_codes', 'hscode',
        existing_type=sa.String(length=20),
        type_=sa.String(length=16),
        existing_nullable=False,
    )
