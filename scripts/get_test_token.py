#!/usr/bin/env python3
"""Fetch a Firebase ID token for a configured test profile."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional
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
    """Load local env files in the same order as the app."""
    root = Path(__file__).resolve().parent.parent
    load_env_file(root / ".env", override=False)
    load_env_file(root / ".env.local", override=True)


def load_env_file(path: Path, override: bool) -> None:
    """Load a simple .env file into os.environ."""
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch a Firebase bearer token for a configured test profile.",
    )
    parser.add_argument(
        "profile",
        nargs="?",
        default="owner",
        choices=sorted(PROFILE_ENV_PREFIXES),
        help="Named test profile to use.",
    )
    parser.add_argument("--email", help="Override the profile email.")
    parser.add_argument("--password", help="Override the profile password.")
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print structured output instead of just the token.",
    )
    parser.add_argument(
        "--header",
        action="store_true",
        help='Print the full Authorization header value, e.g. "Bearer <token>".',
    )
    return parser.parse_args()


def get_profile_credentials(profile: str) -> tuple[Optional[str], Optional[str]]:
    prefix = PROFILE_ENV_PREFIXES[profile]
    email = os.getenv(f"{prefix}_EMAIL")
    password = os.getenv(f"{prefix}_PASSWORD")
    return email, password


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value:
        return value
    raise SystemExit(f"Missing required environment variable: {name}")


def fetch_token(api_key: str, email: str, password: str) -> dict:
    request = Request(
        url=(
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?"
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
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise SystemExit(f"Firebase sign-in failed: {detail}") from exc
    except URLError as exc:
        raise SystemExit(f"Could not reach Firebase auth endpoint: {exc}") from exc


def main() -> int:
    load_local_env()
    args = parse_args()

    api_key = require_env("FIREBASE_API_KEY")
    email, password = get_profile_credentials(args.profile)
    email = args.email or email
    password = args.password or password

    if not email or not password:
        raise SystemExit(
            f"Missing credentials for profile '{args.profile}'. "
            f"Set {PROFILE_ENV_PREFIXES[args.profile]}_EMAIL and "
            f"{PROFILE_ENV_PREFIXES[args.profile]}_PASSWORD in .env.local."
        )

    token_response = fetch_token(api_key, email, password)
    token = token_response["idToken"]

    if args.json:
        print(
            json.dumps(
                {
                    "profile": args.profile,
                    "email": email,
                    "authorization_header": f"Bearer {token}",
                    "id_token": token,
                    "expires_in": token_response.get("expiresIn"),
                    "refresh_token": token_response.get("refreshToken"),
                    "firebase_local_id": token_response.get("localId"),
                },
                indent=2,
            )
        )
        return 0

    if args.header:
        print(f"Bearer {token}")
        return 0

    print(token)
    return 0


if __name__ == "__main__":
    sys.exit(main())
