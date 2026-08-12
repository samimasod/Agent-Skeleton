#!/usr/bin/env python3
"""Import an HS code CSV into the local application database."""

from __future__ import annotations

import argparse
import asyncio
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import an HS code taxonomy CSV.")
    parser.add_argument("csv_path", help="Path to the HS code CSV file.")
    parser.add_argument(
        "--append",
        action="store_true",
        help="Append instead of replacing the existing HS code table.",
    )
    raw_args = sys.argv[1:]
    if raw_args and raw_args[0] == "--":
        raw_args = raw_args[1:]
    return parser.parse_args(raw_args)


async def run_import(csv_path: str, append: bool) -> None:
    from apps.api.core.database.connection import AsyncSessionLocal, init_db
    from apps.api.modules.hs_codes.repository import HSCodeRepository
    from apps.api.modules.hs_codes.service import HSCodeService

    await init_db()

    async with AsyncSessionLocal() as session:
        service = HSCodeService(HSCodeRepository(session))
        result = await service.import_from_csv(csv_path=csv_path, replace_existing=not append)
        await session.commit()
        print(f"Imported {result.imported_count} HS codes from {result.csv_path}")


def main() -> int:
    args = parse_args()
    asyncio.run(run_import(args.csv_path, args.append))
    return 0


if __name__ == "__main__":
    sys.exit(main())
