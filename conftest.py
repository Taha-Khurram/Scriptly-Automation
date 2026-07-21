"""Pytest fixtures & hooks for the Scriptly automation framework.

Provides:
- ``app_settings``    : the shared, env-driven Settings object.
- browser context/page configured from settings (base_url, timeout, headless).
- ``logged_in_page``  : Tier 2 — a page authenticated via the real Firebase flow
                        (auto-skips unless TEST_EMAIL/TEST_PASSWORD are set).
- automatic screenshot capture on any test failure, saved under reports/.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Make the framework root importable (config/, pages/, utils/, data/).
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.settings import settings  # noqa: E402

REPORTS_DIR = ROOT / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


@pytest.fixture(scope="session")
def app_settings():
    """The shared, immutable Settings instance."""
    return settings


# --- Configure pytest-playwright from our settings ---------------------------

@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    return {**browser_type_launch_args, "headless": settings.headless}


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {
        **browser_context_args,
        "base_url": settings.base_url,
        "ignore_https_errors": True,
        "viewport": {"width": 1366, "height": 900},
    }


@pytest.fixture(autouse=True)
def _apply_default_timeout(page):
    """Apply the configured default timeout to every page."""
    page.set_default_timeout(settings.default_timeout)
    yield


# --- Tier 2: authenticated session ------------------------------------------

@pytest.fixture
def logged_in_page(page, app_settings):
    """Log in through the real Firebase flow and return an authenticated page.

    Skips automatically when credentials are not configured.
    """
    if not app_settings.has_credentials:
        pytest.skip("TEST_EMAIL / TEST_PASSWORD not set — Tier 2 auth tests skipped")

    from pages.login_page import LoginPage

    login = LoginPage(page)
    login.open()
    login.sign_in(app_settings.test_email, app_settings.test_password)
    # After a successful Firebase login the app redirects to the dashboard.
    page.wait_for_url("**/dashboard", timeout=app_settings.default_timeout)
    return page


# --- Screenshot on failure ---------------------------------------------------

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        page = item.funcargs.get("page")
        if page is not None:
            safe_name = item.nodeid.replace("/", "_").replace("::", "__").replace(":", "_")
            shot = REPORTS_DIR / f"FAIL_{safe_name}.png"
            try:
                page.screenshot(path=str(shot), full_page=True)
            except Exception:
                pass
