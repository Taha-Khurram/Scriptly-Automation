<div align="center">

<img src="../FYP-main/app/static/images/git.png" alt="Scriptly" width="260" />

# Scriptly — UI Test Automation Framework

**Test the whole platform. No credentials required. Evidence on every failure.**

A Playwright + Pytest automation framework for **Scriptly** (the Flask AI Blog Platform in
[`../FYP-main`](../FYP-main)). Built on the **Page Object Model**, it maps the app's
**entire ~110-endpoint surface** and verifies every core functionality on two tiers —
credential-free access control that runs anywhere, and opt-in authenticated flows.

![Playwright](https://img.shields.io/badge/Playwright-1.48-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![Pytest](https://img.shields.io/badge/Pytest-8.3-0A9EDC?style=flat-square&logo=pytest&logoColor=white)
![Pattern](https://img.shields.io/badge/Pattern-Page%20Object%20Model-6E56CF?style=flat-square)
![Report](https://img.shields.io/badge/Report-pytest--html-FF6C37?style=flat-square)
![Browsers](https://img.shields.io/badge/Browsers-Chromium%20%C2%B7%20Firefox%20%C2%B7%20WebKit-FFCA28?style=flat-square&logo=googlechrome&logoColor=black)
![License](https://img.shields.io/badge/License-Proprietary%20(All%20Rights%20Reserved)-6E56CF?style=flat-square)

</div>

---

## 🌟 Highlights

- **🛡️ Full-surface access control** — one parametrized suite probes **every protected endpoint** in the app (103 routes across 14 features) and asserts a logged-out caller gets exactly the documented guard: `302` redirect, `401`/`403` JSON, or an admin-hidden `404`. Runs with **zero credentials**, so it protects the whole API in CI.
- **🔄 Full lifecycle end-to-end** — one test drives a blog through the entire pipeline as an admin: **generate (AI) → humanize (AI) → SEO optimize → push for approval → publish → verify it's live on the public site** → clean up. Proves the whole content journey, not just isolated screens.
- **🎭 Playwright, not Selenium** — auto-waiting for network + DOM state kills the flakiness of a JS-heavy Firebase app; ships its own browsers, tracing, and screenshots. (See the [tooling decision](plan.md#1-tooling-decision) for why.)
- **🧩 Page Object Model** — every screen is a class exposing intent-level methods (`login.sign_in(...)`); tests assert behaviour, never raw selectors.
- **🎚️ Two-tier strategy** — Tier 1 (no creds) always runs; Tier 2 authenticated flows unlock automatically when `TEST_EMAIL`/`TEST_PASSWORD` are set, logging in through the **real Firebase flow**.
- **💸 Cost-safe by default** — paid AI/API paths (Gemini generate/humanize, RapidAPI) are gated behind `RUN_EXPENSIVE=1`, so a normal run never spends a credit.
- **📸 Evidence on failure** — a full-page screenshot is captured automatically for any failing test and saved to `reports/`.
- **⚙️ Config-driven** — base URL, headless flag, timeouts, slug, and credentials all come from a single `.env`-backed frozen `Settings`.
- **📊 Self-contained HTML report** — every run emits `reports/report.html` via `pytest-html`.

---

## 🧰 Tech stack

| Concern | Choice |
|---------|--------|
| **Driver** | [Playwright](https://playwright.dev/python/) 1.48 (auto-wait, tracing, multi-browser) |
| **Runner** | Pytest 8.3 + `pytest-playwright` 0.5 |
| **Language** | Python 3.11 |
| **Pattern** | Page Object Model (one class per screen) |
| **Config** | `python-dotenv` → frozen `Settings` dataclass |
| **Reporting** | `pytest-html` (self-contained) + screenshot-on-failure hook |
| **Browsers** | Chromium (default) · Firefox · WebKit |

---

## 🚀 Quick start

### Prerequisites
- Python 3.11
- The Scriptly Flask app reachable at `BASE_URL` (default `http://localhost:5000`)

### Install
```powershell
# from this directory (Automation-Framework)
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m playwright install chromium      # add firefox / webkit if you want them

copy .env.example .env                      # then edit values
```

### Start the app under test
```powershell
# in another terminal
cd ..\FYP-main
python app.py                               # serves http://localhost:5000
```

### Run the suite
```powershell
pytest                              # full Tier-1 suite, headless, HTML report
pytest --headed --slowmo 300        # watch it run in a real browser
pytest tests/test_login.py          # a single suite
pytest -m smoke                     # smoke subset only
pytest --browser firefox            # a different engine
```

---

## 🎚️ Test tiers

Real login needs a live Firebase project and a real Gmail account, so authenticated flows
**cannot run headless in CI without credentials**. The framework splits accordingly:

| Tier | Needs creds? | What it covers | When it runs |
|:----:|:------------:|----------------|--------------|
| **Tier 1** | ❌ No | Access-control contract across the full API, auth screens, navigation guards, public site + interactions | Always (default `pytest`) |
| **Tier 2** | ✅ Yes | Every dashboard screen loads, feature read-APIs return data, category/blog workflow, **full lifecycle E2E** | Opt-in via `-m auth` + env creds |

### Enabling Tier 2 (authenticated)
Set real Firebase Gmail credentials in `.env` (`TEST_EMAIL`, `TEST_PASSWORD`) and run:

```powershell
pytest -m auth                          # authenticated dashboard + feature-API + blog workflow
$env:RUN_EXPENSIVE=1; pytest -m auth    # ALSO run the AI generation + full lifecycle E2E (spends Gemini credits)
```

Without credentials these tests **skip automatically** (`pytest.mark.skipif`), keeping any
environment green.

> **💸 Cost safety:** AI/paid-API paths (Gemini generate/humanize, RapidAPI) are marked
> `@pytest.mark.expensive` and skipped unless `RUN_EXPENSIVE=1`. Public-site tests self-skip
> when `SITE_SLUG` doesn't resolve, so a fresh database stays green.

---

## 🔎 Coverage

The framework maps the **entire route surface** — the full catalog lives in
[`data/endpoints.py`](data/endpoints.py), each route recording its method, feature, and the
status a logged-out caller must receive.

### Tier 1 — no credentials (default suite)

| Suite | What it verifies | Functionality |
|-------|------------------|---------------|
| [`test_access_control.py`](tests/test_access_control.py) | Every protected endpoint denies a logged-out caller with the **exact documented guard**; public endpoints stay reachable. Parametrized over the full catalog (**207 cases**: 103 endpoints × denied + exact-guard, + 1 public). | **All 14 features** |
| [`test_login.py`](tests/test_login.py) | Renders; fields + Google button; HTML5 `required` blocks empty submit; links; `?expired=1`. | Auth · Login |
| [`test_signup.py`](tests/test_signup.py) | Renders; Gmail-only + password-policy hints; `?invite=` prefill/lock; link to login. | Auth · Signup |
| [`test_forgot_password.py`](tests/test_forgot_password.py) | Renders; email field; unknown-email API path; back-to-login link. | Auth · Password reset |
| [`test_navigation.py`](tests/test_navigation.py) | Protected dashboard routes redirect to `/login` when logged out. | Access guard (page tier) |
| [`test_public_site.py`](tests/test_public_site.py) | Home/blog/about/contact/legal respond; contact form; `robots.txt`/`sitemap.xml`/`feed.xml`; unknown-site handling. | Public site |
| [`test_public_site_interactions.py`](tests/test_public_site_interactions.py) | Newsletter-subscribe validation; semantic-search query validation; contact-form fields. | Public site · Leads/Newsletter/Search |

### Tier 2 — authenticated (`-m auth`)

| Suite | What it verifies | Functionality |
|-------|------------------|---------------|
| [`test_dashboard_pages.py`](tests/test_dashboard_pages.py) | All 20 feature screens load for a logged-in user without bouncing to login; admin-only Users page handled. | All dashboard screens |
| [`test_feature_apis.py`](tests/test_feature_apis.py) | 15 non-destructive read APIs return `200` JSON (blogs, comments, activity, leads, gallery, schedule, newsletter, optimization, SEO drafts). | All feature data reads |
| [`test_blog_workflow.py`](tests/test_blog_workflow.py) | Category CRUD end-to-end (create → rename → delete); empty-name rejection; blog-listing structure; **AI generation** kickoff behind `@expensive`. | Blog lifecycle · Categories · AI pipeline |
| [`test_blog_lifecycle_e2e.py`](tests/test_blog_lifecycle_e2e.py) | **Full pipeline E2E** (behind `@expensive`): generate → humanize → SEO optimize → push for approval → assert the post `404`s while unpublished → publish (admin) → **verify it's live on the public site** (`200` + title rendered + in blog listing) → delete. | End-to-end content lifecycle → public site |

### Verified access-control contract *(ground truth from the running app)*

| Guard | Endpoints |
|-------|-----------|
| **`302` → /login** | dashboard pages + blog, categories, SEO, comments, activity, leads, optimization, analytics, settings APIs |
| **`401` JSON** | gallery, newsletter, schedule APIs |
| **`403`** | `POST /api/admin/create-user` |
| **`404` (hidden)** | user-management endpoints (`/manage-users`, `/list`, `/invite`, …) |
| **`200` (public)** | `/settings/general/public` |

---

## 🏗️ Architecture

```
tests/  ──uses──▶  pages/  ──extend──▶  BasePage  ──reads──▶  config/settings.py  ◀── .env
  │                                                                  ▲
  │                                                                  │
  └──parametrized by──▶ data/endpoints.py · data/test_data.py        │
                                                                     │
conftest.py ── fixtures (app_settings, logged_in_page) ──────────────┘
            └─ hook: screenshot on failure ──▶ reports/FAIL_*.png
```

- **Page Objects** — every screen is a class exposing intent-level methods; locators live in the page object, tests assert behaviour, not markup.
- **Fixtures over setup code** — `conftest.py` supplies `app_settings`, configures the Playwright context (base URL, viewport, timeout, headless) from settings, and provides an authenticated `logged_in_page` for Tier 2.
- **Deterministic waits** — Playwright auto-waiting + explicit `expect`; no `sleep`.
- **Evidence on failure** — a `pytest_runtest_makereport` hook captures a full-page screenshot for any failing test.

<details>
<summary><strong>🧩 Page Objects</strong></summary>

`BasePage` provides navigation (`open`, `current_url`), waits, and query helpers
(`is_visible`, `text_of`). Every screen extends it:

| Page Object | Screen |
|-------------|--------|
| `LoginPage` | `/login` — email/password form, Google sign-in button |
| `SignupPage` | `/signup` — Gmail-only signup, invite prefill |
| `ForgotPasswordPage` | `/forgot-password` — email check |
| `DashboardPage` | route map of all 20 feature screens (`go(name)`) + protected-route access |
| `PublicSitePage` | `/site/<slug>` — public pages, contact, newsletter, search |

</details>

<details>
<summary><strong>🔐 Tier 2 authentication flow</strong></summary>

```
logged_in_page fixture → LoginPage.open() → sign_in(email, pw)
   → real Firebase JS auth → POST /api/auth/verify → redirect to /dashboard
```

The fixture skips automatically when `TEST_EMAIL`/`TEST_PASSWORD` are unset, so Tier 2
never breaks a credential-free run.

</details>

<details>
<summary><strong>🔄 Full lifecycle E2E flow</strong></summary>

```
POST /api/generate ─▶ poll task ─▶ find new DRAFT (id + author_id)
   │
   ├─▶ POST /api/humanize/<id>          ─▶ poll task           (AI rewrite)
   ├─▶ POST /api/seo/optimize-blog/<id> ─▶ 200 (sync SEO agent)
   ├─▶ POST /api/update_status  UNDER_REVIEW   ─▶ status flips
   ├─▶ GET  /site/<slug>/post/<id>       ─▶ 404  (guard: not yet public)
   ├─▶ POST /api/update_status  PUBLISHED (admin) ─▶ status flips
   └─▶ GET  /site/<slug>/post/<id>       ─▶ 200 + optimized title rendered
       GET  /site/<slug>/blog            ─▶ 200 (post in listing)
   finally: DELETE /api/delete_blog/<id>            (cleanup)
```

Verification uses the blog's **current** title (re-fetched after SEO rewrites it), not the
prompt. Public checks address the post by the site **slug**, and AI calls get generous
per-request timeouts since optimize/publish run synchronously. Requires `-m auth` **and**
`RUN_EXPENSIVE=1`; takes ~3–4 min.

</details>

---

## 📁 Project structure

```
Automation-Framework/
├── plan.md                  # full design doc: tooling rationale, SUT map, coverage matrix
├── README.md                # this file
├── requirements.txt         # playwright, pytest, pytest-playwright, pytest-html, python-dotenv
├── pytest.ini               # markers, default addopts, HTML report config
├── conftest.py              # fixtures (app_settings, logged_in_page) + screenshot-on-failure hook
├── .env.example             # BASE_URL, HEADLESS, DEFAULT_TIMEOUT, SITE_SLUG, TEST_EMAIL, TEST_PASSWORD
├── config/
│   └── settings.py          # frozen, env-driven Settings (base URL, headless, timeout, slug, creds)
├── pages/                   # Page Objects — one class per screen, all extend BasePage
│   ├── base_page.py         # navigation, waits, query helpers
│   ├── login_page.py
│   ├── signup_page.py
│   ├── forgot_password_page.py
│   ├── dashboard_page.py    # sidebar nav + protected-route access
│   └── public_site_page.py
├── tests/                   # 11 suites · 38 test functions → 294 parametrized cases
│   ├── test_access_control.py        # full-surface guard contract (Tier 1)
│   ├── test_login.py · test_signup.py · test_forgot_password.py
│   ├── test_navigation.py · test_public_site.py · test_public_site_interactions.py
│   ├── test_dashboard_pages.py        # Tier 2
│   ├── test_feature_apis.py           # Tier 2
│   ├── test_blog_workflow.py          # Tier 2
│   └── test_blog_lifecycle_e2e.py     # Tier 2 · full pipeline → public site (@expensive)
├── data/
│   ├── endpoints.py         # full endpoint catalog + observed logged-out guard per route
│   └── test_data.py         # inputs, expected messages, protected/public route lists
├── utils/
│   └── helpers.py           # shared helpers: unique Gmail, poll_task (async AI task polling)
└── reports/                 # generated report.html + FAIL_*.png failure screenshots
```

---

## 🔑 Configuration

All knobs are read once from a local `.env` (see [`.env.example`](.env.example)) into a
single frozen `Settings` instance:

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | URL of the running Scriptly app | `http://localhost:5000` |
| `HEADLESS` | Run browsers headless (`true`) or visible (`false`) | `true` |
| `DEFAULT_TIMEOUT` | Default action/navigation timeout (ms) | `30000` |
| `SITE_SLUG` | Public-site slug for public-site tests (self-skips on 404) | `demo` |
| `TEST_EMAIL` | **Tier 2 only** — real Gmail in the app's Firebase project | *(blank → skip)* |
| `TEST_PASSWORD` | **Tier 2 only** — password for `TEST_EMAIL` | *(blank → skip)* |

`RUN_EXPENSIVE` is a run-time gate (not stored in `.env`): set `RUN_EXPENSIVE=1` to enable
the `@expensive` AI tests (blog generation + the full lifecycle E2E). Unset → they skip.

---

## 🏷️ Markers

Declared in [`pytest.ini`](pytest.ini) (`--strict-markers` is enforced):

| Marker | Meaning |
|--------|---------|
| `smoke` | Fast, high-value checks that should always pass |
| `auth` | Tier 2 tests requiring real Firebase credentials |
| `public` | Public-facing blog-site tests |
| `expensive` | Consumes paid AI/API quota — runs only with `RUN_EXPENSIVE=1` |

---

## 📊 Reports & evidence

- **HTML report:** open [`reports/report.html`](reports/report.html) after any run (self-contained, via `pytest-html`).
- **Failure screenshots:** full-page captures land in `reports/` as `FAIL_<test-id>.png`, generated by the `conftest.py` hook.
- **Cross-browser:** `--browser chromium|firefox|webkit` (pytest-playwright).

---

## 📚 Design doc

See [`plan.md`](plan.md) for the full design: the tooling decision (why Playwright over
Selenium/Maven), the system-under-test map, the two-tier strategy, the complete coverage
matrix, and the roadmap.

---

## 📄 License

**Proprietary — All Rights Reserved.** © 2026 Taha Khurram. Part of the Scriptly Final Year
Project. See [`LICENSE`](LICENSE) for full terms (and the [main project license](../FYP-main/LICENSE)
for the application under test). No use, copying, modification, or distribution is permitted
without the Author's prior written permission.
