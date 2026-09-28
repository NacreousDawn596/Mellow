"""Configuration for Mellow.

The YouTube API key may be supplied via environment variable (preferred), a
Base64-encoded environment variable, or an embedded Base64 placeholder.

IMPORTANT: Base64 is NOT encryption. Embedding the key this way only avoids
casually exposing it in plain text in source. For a real deployment, prefer the
``YOUTUBE_API_KEY`` environment variable.
"""

import base64
import os

# Base64-encoded YouTube Data API v3 key (avoids casual plaintext exposure).
# Base64 is NOT encryption — for a shared deployment, prefer the
# YOUTUBE_API_KEY environment variable instead.
_PLACEHOLDER_B64 = "QUl6YVN5Qm1UNG5XcVF1NXZiRmZXVjRyM25fT0NzbTJXR1dlb1pF"

_NOT_CONFIGURED = "NOT_CONFIGURED"


def _decode(b64: str) -> str:
    try:
        return base64.b64decode(b64.encode("ascii")).decode("utf-8")
    except Exception:
        return ""


def load_youtube_api_key() -> str:
    # 1) Plain environment variable takes priority.
    env = os.environ.get("YOUTUBE_API_KEY", "").strip()
    if env:
        return env

    # 2) Base64-encoded environment variable.
    b64 = os.environ.get("YOUTUBE_API_KEY_B64", "").strip()
    if b64:
        return _decode(b64)

    # 3) Embedded Base64 placeholder (development convenience).
    return _decode(_PLACEHOLDER_B64)


class Settings:
    def __init__(self) -> None:
        self.youtube_api_key = load_youtube_api_key()
        self.app_port = int(os.environ.get("APP_PORT", "17432"))
        self.log_level = os.environ.get("LOG_LEVEL", "info").lower()


settings = Settings()
