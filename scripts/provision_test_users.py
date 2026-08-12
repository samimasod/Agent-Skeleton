#!/usr/bin/env python3
"""Provision Firebase test users from configured env profiles."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROFILE_ENV_PREFIXES = {
    "owner": "TEST_AUTH_OWNER",
    "admin": "TEST_AUTH_ADMIN",
    "member": "TEST_AUTH_MEMBER",
    "outsider": "TEST_AUTH_OUTSIDER",
}


def load_local_env() -> None:
    root = Path(__file__).resolve().parent.parent
    load_env_file(root / ".env", override=False)
    load_env_file(root / ".env.local", override=True)


def load_env_file(path: Path, override: bool) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if override or key not in os.environ:
            os.environ[key] = value


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise SystemExit(f"Missing required environment variable: {name}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create Firebase test users from .env.local profiles.",
    )
    parser.add_argument(
        "profiles",
        nargs="*",
        choices=sorted(PROFILE_ENV_PREFIXES),
        help="Optional list of profile names to provision. Defaults to all configured profiles.",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print structured JSON output instead of summary lines.",
    )
    return parser.parse_args()


def get_profile_credentials(profile: str) -> tuple[str | None, str | None]:
    prefix = PROFILE_ENV_PREFIXES[profile]
    return os.getenv(f"{prefix}_EMAIL"), os.getenv(f"{prefix}_PASSWORD")


def sign_up_user(api_key: str, email: str, password: str) -> tuple[str, dict]:
    request = Request(
        url=(
            "https://identitytoolkit.googleapis.com/v1/accounts:signUp?"
            + urlencode({"key": api_key})
        ),
        data=json.dumps(
            {
                "email": email,
                "password": password,
                "returnSecureToken": True,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            return "created", json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8")
        try:
            error_payload = json.loads(detail)
            message = error_payload.get("error", {}).get("message")
        except json.JSONDecodeError:
            message = None
        if message == "EMAIL_EXISTS":
            return "exists", {"email": email}
        raise SystemExit(f"Firebase sign-up failed for {email}: {detail}") from exc
    except URLError as exc:
        raise SystemExit(f"Could not reach Firebase auth endpoint: {exc}") from exc


def main() -> int:
    load_local_env()
    args = parse_args()

    api_key = require_env("FIREBASE_API_KEY")
    selected_profiles = args.profiles or list(PROFILE_ENV_PREFIXES)

    results: list[dict[str, str]] = []
    for profile in selected_profiles:
        email, password = get_profile_credentials(profile)
        if not email or not password:
            continue
        status, payload = sign_up_user(api_key, email, password)
        results.append(
            {
                "profile": profile,
                "email": email,
                "status": status,
                "firebase_local_id": payload.get("localId", ""),
            }
        )

    if args.json:
        print(json.dumps({"results": results}, indent=2))
        return 0

    if not results:
        print("No configured test-user profiles found in .env.local.")
        return 0

    for result in results:
        print(f"{result['profile']}: {result['status']} ({result['email']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
