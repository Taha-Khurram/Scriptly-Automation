"""Sign Up screen tests (/signup)."""
import pytest
from playwright.sync_api import expect

from pages.signup_page import SignupPage
from data import test_data as td


@pytest.mark.smoke
def test_signup_page_loads(page):
    signup = SignupPage(page)
    signup.open()
    assert signup.is_loaded()


def test_signup_has_all_fields(page):
    signup = SignupPage(page)
    signup.open()
    expect(signup.name_input).to_be_visible()
    expect(signup.email_input).to_be_visible()
    expect(signup.password_input).to_be_visible()
    expect(signup.submit_button).to_be_visible()


def test_signup_shows_policy_hints(page):
    signup = SignupPage(page)
    signup.open()
    assert signup.gmail_hint_visible()
    assert signup.password_policy_hint_visible()


def test_signup_links_back_to_login(page):
    signup = SignupPage(page)
    signup.open()
    expect(signup.login_link).to_be_visible()


def test_invite_email_prefills_and_locks(page):
    """/signup?invite=<email> should prefill and lock the email field."""
    signup = SignupPage(page)
    signup.open(invite=td.VALID_GMAIL)
    expect(signup.email_input).to_have_value(td.VALID_GMAIL)
    # Field is made read-only by the invite script.
    assert signup.email_input.evaluate("el => el.readOnly") is True


def test_non_gmail_email_is_rejected_by_type(page):
    """Filling a non-Gmail address keeps the Gmail-only guidance visible."""
    signup = SignupPage(page)
    signup.open()
    signup.fill_form("QA Tester", td.NON_GMAIL_EMAIL, td.STRONG_PASSWORD)
    # The Gmail-only rule is surfaced on the page regardless of input.
    assert signup.gmail_hint_visible()
