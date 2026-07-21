"""Central, env-driven configuration for the automation framework.

All runtime knobs (base URL, headless flag, timeouts, credentials) are read once
from the environment (populated from a local .env via python-dotenv) and exposed
through a single frozen ``Settings`` instance imported everywhere else.
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

# Load .env sitting next to the framework root (if present).
_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env")


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    base_url: str = os.getenv("BASE_URL", "http://localhost:5000").rstrip("/")
    headless: bool = _as_bool(os.getenv("HEADLESS"), default=True)
    default_timeout: int = int(os.getenv("DEFAULT_TIMEOUT", "30000"))
    site_slug: str = os.getenv("SITE_SLUG", "demo")

    # Tier 2 (authenticated) credentials — empty means auth tests are skipped.
    test_email: str = os.getenv("TEST_EMAIL", "")
    test_password: str = os.getenv("TEST_PASSWORD", "")

    @property
    def has_credentials(self) -> bool:
        return bool(self.test_email and self.test_password)

    def url(self, path: str = "") -> str:
        """Join a path onto the base URL."""
        if not path:
            return self.base_url
        return f"{self.base_url}/{path.lstrip('/')}"


settings = Settings()
