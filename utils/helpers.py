"""Small shared helpers used across page objects and tests."""
from __future__ import annotations

import time


def unique_gmail(prefix: str = "scriptly.qa") -> str:
    """Return a unique @gmail.com address for signup-style tests."""
    return f"{prefix}+{int(time.time() * 1000)}@gmail.com"


def poll_task(request, status_url: str, timeout_s: int = 300, interval_s: float = 3.0) -> dict:
    """Poll a background task (generation / humanize) until it finishes.

    ``status_url`` is the fully-built ``/api/generate/status/<task_id>`` URL.
    Returns the final status payload on success; raises AssertionError on
    failure or timeout. Task lifecycle: pending -> running -> completed|failed.
    """
    deadline = time.time() + timeout_s
    last: dict = {}
    while time.time() < deadline:
        resp = request.get(status_url, fail_on_status_code=False)
        if resp.status == 200:
            last = resp.json()
            status = last.get("status")
            if status == "completed":
                return last
            if status == "failed":
                raise AssertionError(f"Task failed: {last.get('error')}")
        time.sleep(interval_s)
    raise AssertionError(f"Task did not finish within {timeout_s}s; last payload={last}")
