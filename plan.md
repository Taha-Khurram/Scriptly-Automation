# Scriptly — Test Automation Framework Plan

UI automation framework for **Scriptly** (the AI Blog Platform in `../FYP-main`), an
AI‑powered blog content platform built with Flask + Google Gemini + Firebase.

---

## 1. Tooling decision

| Candidate | Verdict | Reason |
|-----------|:------:|--------|
| **Playwright + Python + Pytest** | ✅ **Chosen** | App is Python 3.11 / Flask and already uses Pytest. Playwright is fast, has auto‑waiting (critical for a JS‑heavy Firebase app), built‑in tracing/screenshots/video, and installs its own browsers. |
| Selenium + Java + Maven | ❌ | Only **Java 8** is installed (Selenium 4 needs 11+) and Maven is misconfigured (`JAVA_HOME` invalid). The empty `pom.xml` was a stalled attempt and has been removed. |
| Selenium + Python | ➖ | Workable, but needs manual driver/wait management. Playwright gives the same language with less boilerplate. |

**Selected stack:** Playwright · Python 3.11 · Pytest · `pytest-playwright` · Page Object Model.

Why this matters for Scriptly specifically: authentication and the whole dashboard are
driven by the **Firebase JS SDK** (client‑side token minting, then `POST /api/auth/verify`).
Pages render, then JavaScript hydrates them — so a driver with **automatic waiting for network
+ DOM state** removes the flakiness that plagues raw Selenium here.

---

## 2. Understanding the system under test (SUT)

Flask app (`app factory` + blueprints). Key user‑facing surfaces the framework targets:

| Surface | Route(s) | Auth | Notes for automation |
|---------|----------|:----:|----------------------|
| Login | `/login` | public | Email + password form (`no-loader`), Google button `#googleSignIn`. Firebase JS auth. |
| Signup | `/signup` | public | `#signupForm` with `#username`, `#email`, `#password`; Gmail‑only rule; inline error spans. |
| Forgot password | `/forgot-password` | public | Email form; `POST /api/auth/check-email`. |
| Dashboard home | `/dashboard` | 🔒 | Redirects to `/login` when not authenticated. |
| Create / Drafts / Approval / Categories / Comments | `/create`, `/drafts`, `/approval`, `/categories`, `/comments` | 🔒 | Redirect‑to‑login when logged out. |
| SEO / Optimization / Analytics / Schedule / Leads / Gallery / Newsletter / Settings / Users | `/seo-tools`, `/optimization`, `/analytics`, `/schedule`, `/leads`, `/gallery`, `/newsletter`, `/settings`, `/users/...` | 🔒 | Same protected pattern. |
| Public site | `/site/<slug>` (+ `/blog`, `/post/<slug>`, `/about`, `/contact`, `/privacy-policy`, `/terms-of-service`) | public | SEO pages, contact form, newsletter subscribe, semantic search. |
| Public feeds | `/site/<slug>/robots.txt`, `/sitemap.xml`, `/feed.xml` | public | Content‑type / status assertions. |

### Auth reality & test strategy
Real login requires a live Firebase project + a real Gmail account, so it **cannot run headless
without credentials**. The framework therefore splits tests into two tiers:

- **Tier 1 — No‑credentials (always runs in CI):** page rendering, form structure, client‑side
  validation, navigation, redirect‑when‑logged‑out guards, public‑site pages, feeds, negative
  auth (wrong password shows an error). This is the default suite.
- **Tier 2 — Authenticated (opt‑in):** gated behind `TEST_EMAIL` / `TEST_PASSWORD` env vars.
  Skipped automatically when unset (`pytest.mark.skipif`). Logs in through the real Firebase
  flow once per session and reuses the storage state.

---

## 3. Framework architecture (Page Object Model)

```
Automation-Framwork/
├── plan.md                  # this document
├── README.md                # how to install & run
├── requirements.txt         # playwright, pytest, pytest-playwright, python-dotenv, ...
├── pytest.ini               # markers, addopts, html report config
├── conftest.py              # fixtures: settings, browser context, page, auth state, screenshots
├── .env.example             # BASE_URL, TEST_EMAIL, TEST_PASSWORD, HEADLESS, ...
├── .gitignore
├── config/
│   └── settings.py          # typed settings loaded from env (BASE_URL, timeouts, creds)
├── pages/                   # Page Objects — one class per screen, all extend BasePage
│   ├── base_page.py         # navigation, waits, safe click/fill, screenshot helpers
│   ├── login_page.py
│   ├── signup_page.py
│   ├── forgot_password_page.py
│   ├── dashboard_page.py    # sidebar nav + protected-route access
│   └── public_site_page.py
├── tests/                   # test suites grouped by feature
│   ├── test_login.py
│   ├── test_signup.py
│   ├── test_forgot_password.py
│   ├── test_navigation.py   # protected routes redirect to /login
│   └── test_public_site.py
├── data/
│   └── test_data.py         # valid/invalid inputs, expected messages, route lists
├── utils/
│   └── helpers.py           # small shared helpers (unique email, url join)
└── reports/                 # generated HTML report + screenshots (gitignored)
```

### Design principles
- **Page Object Model** — every screen is a class exposing intent‑level methods
  (`login_page.sign_in(email, pw)`), never raw selectors in tests.
- **Locators centralised** in each page object; tests assert behaviour, not markup.
- **Fixtures over setup code** — `conftest.py` supplies `settings`, `context`, `page`, and an
  authenticated `logged_in_page` (Tier 2).
- **Config‑driven** — base URL, headless flag, timeouts, and credentials all come from `.env`.
- **Deterministic waits** — rely on Playwright auto‑waiting + explicit `expect`; no `sleep`.
- **Evidence on failure** — screenshot (and trace when enabled) captured automatically for any
  failing test, saved under `reports/`.

---

## 4. Test coverage — every core functionality

The framework maps the **entire route surface** (~110 endpoints across 14 blueprints,
catalogued in `data/endpoints.py`) and covers each core functionality on two axes:
**access control** (runs now, no credentials) and **authenticated behaviour** (Tier 2).

### Tier 1 — runs now, no credentials (293 test cases)

| Suite | What it covers | Functionality |
|-------|----------------|---------------|
| `test_access_control.py` | Every protected endpoint denies a logged‑out caller with the exact documented guard (302 redirect / 401 / 403 / 404), plus intentionally‑public endpoints stay reachable. Parametrized over the **full** catalog. | **All 14 features** — blog lifecycle, categories, SEO, comments, activity, leads, gallery, newsletter, optimization, schedule, analytics, settings, site‑settings, user management |
| `test_login.py` | Renders; fields + Google button; HTML5 `required` blocks empty submit; links; `?expired=1`. | Auth · Login |
| `test_signup.py` | Renders; fields; Gmail‑only + password‑policy hints; `?invite=` prefill/lock; link to login. | Auth · Signup |
| `test_forgot_password.py` | Renders; email field; unknown‑email API path; back‑to‑login link. | Auth · Password reset |
| `test_navigation.py` | Protected dashboard routes redirect to `/login` when logged out. | Access guard (page tier) |
| `test_public_site.py` | Home, blog, about, contact, privacy, terms respond; contact form; `robots.txt`/`sitemap.xml`/`feed.xml`; unknown‑site handling. | Public site |
| `test_public_site_interactions.py` | Newsletter subscribe validation; semantic‑search query validation; contact form fields. | Public site · Leads/Newsletter/Search |

### Tier 2 — authenticated, opt‑in via `TEST_EMAIL` / `TEST_PASSWORD`

| Suite | What it covers | Functionality |
|-------|----------------|---------------|
| `test_dashboard_pages.py` | Every one of the 20 feature screens loads for a logged‑in user without bouncing to login; admin‑only Users page handled. | All dashboard screens |
| `test_feature_apis.py` | 15 non‑destructive read APIs return 200 JSON (blogs, comments, activity, leads, gallery, schedule, newsletter, optimization, SEO drafts). | All feature data reads |
| `test_blog_workflow.py` | Category CRUD end‑to‑end (create → rename → delete); empty‑name rejection; blog listing structure; **AI generation** kickoff behind `@expensive`. | Blog lifecycle · Categories · AI pipeline |
| `test_blog_lifecycle_e2e.py` | **Full pipeline E2E:** generate (AI) → humanize (AI) → SEO optimize → push for approval → assert post 404s while unpublished → publish (admin) → **verify the post is live on the public site** (200 + title rendered + appears in blog listing) → cleanup. Gated by `@expensive`. | End‑to‑end content lifecycle → public site |

> **Cost safety:** AI/paid‑API paths (Gemini generation/humanize, RapidAPI) are marked
> `@pytest.mark.expensive` and skipped unless `RUN_EXPENSIVE=1`, so a normal run never spends
> credits. Public‑site tests self‑skip when `SITE_SLUG` doesn't resolve, keeping a fresh DB green.

### Verified access-control contract (ground truth from the running app)
| Guard | Endpoints |
|-------|-----------|
| **302 → /login** | dashboard pages + blog, categories, SEO, comments, activity, leads, optimization, analytics, settings APIs |
| **401 JSON** | gallery, newsletter, schedule APIs |
| **403** | `POST /api/admin/create-user` |
| **404 (hidden)** | user‑management endpoints (`/manage-users`, `/list`, `/invite`, …) |
| **200 (public)** | `/settings/general/public` |

---

## 5. Execution & reporting

```bash
# one-time
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
python -m playwright install chromium

# run the whole (Tier 1) suite headless with an HTML report
pytest

# headed / debug
pytest --headed --slowmo 300

# only one suite
pytest tests/test_login.py

# enable Tier 2 authenticated tests
set TEST_EMAIL=you@gmail.com && set TEST_PASSWORD=... && pytest -m auth
```

- **HTML report:** `reports/report.html` (via `pytest-html`).
- **Screenshots/trace on failure:** `reports/` (hook in `conftest.py`).
- **Markers:** `@pytest.mark.smoke`, `@pytest.mark.auth`, `@pytest.mark.public`.
- **Cross‑browser:** `--browser chromium|firefox|webkit` (pytest‑playwright).

### Prerequisite
The Flask app must be reachable at `BASE_URL` (default `http://localhost:5000`). Start it from
`../FYP-main` with `python app.py` before running the suite (or point `BASE_URL` at a deployed
instance).

---

## 6. Roadmap / next steps
1. ✅ Scaffold framework, config, POM, Tier‑1 suites (this deliverable).
2. Wire Tier‑2 authenticated flows once test Firebase credentials exist (create‑blog pipeline,
   humanizer, drafts → approval → publish, settings).
3. Add API‑level checks for `/api/*` JSON endpoints (auth verify, generate status, categories).
4. GitHub Actions workflow: boot the app + run Tier‑1 on every push, publish the HTML report.
5. Visual‑regression snapshots for the public site templates.
