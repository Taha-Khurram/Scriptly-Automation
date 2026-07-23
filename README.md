<div align="center">

# Scriptly — UI Test Automation Framework

**Test the whole platform. No credentials required. Evidence on every failure.**

A pure **[Playwright](https://playwright.dev/) + TypeScript** automation framework for **Scriptly**
(the Flask AI Blog Platform in [`../FYP-main`](../FYP-main)), driven by the **Playwright Test**
runner. Built on the **Page Object Model**, it maps the app's **entire ~110-endpoint surface** and
verifies every core functionality on two tiers — credential-free access control that runs anywhere,
and opt-in authenticated flows that log in through the **real Firebase flow** and reuse a saved
session via a setup project.

![Playwright](https://img.shields.io/badge/Playwright-1.49-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Runner](https://img.shields.io/badge/Runner-%40playwright%2Ftest-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Pattern](https://img.shields.io/badge/Pattern-Page%20Object%20Model-6E56CF?style=flat-square)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Report](https://img.shields.io/badge/Report-HTML%20%C2%B7%20JUnit%20%C2%B7%20Trace-FF6C37?style=flat-square)

</div>

---

## 🌟 Highlights

- **🛡️ Full-surface access control** — one data-driven suite probes **every protected endpoint** (103 routes across 14 features) and asserts a logged-out caller gets exactly the documented guard: `302` redirect, `401`/`403` JSON, or an admin-hidden `404`. Runs with **zero credentials**, so it protects the whole API in CI.
- **🔁 Verified by read-back, not by `success: true`** — every mutation is confirmed by reading the state _back_ from the API. A category isn't "created" until an independent existence probe returns it; it isn't "deleted" until that probe returns `404`; a rename isn't done until the new name is what the app actually renders. Authenticated read APIs are asserted against their **verified JSON shape** (`success` flag + collection keys), not just a `200`.
- **🔄 Full lifecycle end-to-end** — one test drives a blog through the entire pipeline as an admin: **generate (AI) → humanize (AI) → SEO optimize → push for approval → publish → verify it's live on the public site → clean up** — re-reading the blog's status after every transition.
- **🧱 Typed API service layer** — a small `ApiClient` + `BlogApi` / `CategoryApi` wrap the raw endpoints so specs read at intent level (`blogApi.setStatus(id, 'PUBLISHED')`) and read-back queries live in one place, fully typed against the app's real response shapes.
- **🔐 Log in once, reuse everywhere** — a Playwright **setup project** authenticates through the real Firebase flow and saves the session as `storageState`; every `@auth` test reuses it instead of logging in per test.
- **🎭 Auto-waiting, web-first assertions** — Playwright's auto-wait for network + DOM state kills the flakiness of a JS-heavy Firebase app; ships its own browsers, tracing, video, and screenshots.
- **🧩 Page Object Model** — every screen is a class exposing intent-level methods (`loginPage.signIn(...)`); tests assert behaviour, never raw selectors.
- **🎚️ Two-tier strategy** — Tier 1 (no creds) always runs; Tier 2 authenticated flows unlock automatically when `TEST_EMAIL`/`TEST_PASSWORD` are set.
- **💸 Cost-safe by default** — paid AI paths (Gemini generate/humanize) are gated behind `RUN_EXPENSIVE=1`, so a normal run never spends a credit.
- **📸 Evidence on failure** — screenshot **+ video + full Playwright trace** captured automatically for any failing test, under `reports/`.
- **⚙️ Config-driven, zero fragile flags** — base URL, credentials, and every presentation knob come from a single `.env`; a plain `npm test` honours it. No brittle shell variables.
- **📊 Rich reporting** — self-contained **HTML report** (`reports/html`) plus **JUnit XML** (`reports/junit.xml`) for CI.
- **🤖 GitHub Actions CI** — the whole suite runs on every push/PR and uploads the report as an artifact.

---

## 🧰 Tech stack

| Concern             | Choice                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Driver + Runner** | [Playwright Test](https://playwright.dev/docs/test-intro) 1.49 (auto-wait, tracing, projects, fixtures) |
| **Language**        | TypeScript 5.7 (strict)                                                                                 |
| **Pattern**         | Page Object Model (one class per screen) + a typed API service layer + custom fixtures                  |
| **Config**          | `dotenv` → a single trimmed, typed `config` object                                                      |
| **Quality gate**    | `tsc --noEmit` type-check + ESLint (flat config, TS + Playwright rules) + Prettier                      |
| **Reporting**       | HTML (self-contained) + JUnit XML + trace/video/screenshot on failure                                   |
| **CI**              | GitHub Actions — a static-checks gate (type-check/lint/format) then the suite                           |
| **Browser**         | Chromium (bundled) — or your installed Chrome/Edge via `BROWSER_CHANNEL`                                |

---

## 🚀 Quick start

### Prerequisites

- **Node.js 18+** (developed on 22)
- The Scriptly Flask app reachable at `BASE_URL` (default `http://localhost:5000`)

### Install

```bash
npm ci                       # install dependencies
npx playwright install chromium   # download the browser (once)
```

### Configure

```bash
cp .env.example .env         # then edit .env
```

Leave `TEST_EMAIL` / `TEST_PASSWORD` blank to run **Tier 1 only** (all `@auth` tests auto-skip).

### Run

```bash
npm test                     # whole suite, honouring .env (headless by default)
npm run report               # open the HTML report from the last run
```

---

## ▶️ Common commands

| Command                           | What it runs                                              |
| --------------------------------- | --------------------------------------------------------- |
| `npm test`                        | The whole suite (all projects)                            |
| `npm run test:headed`             | Whole suite with the browser visible                      |
| `npm run test:ui`                 | Playwright's interactive **UI mode** (watch, time-travel) |
| `npm run test:smoke`              | Only `@smoke` tests                                       |
| `npm run test:auth`               | Only `@auth` tests (needs credentials)                    |
| `npm run test:public`             | Only `@public` blog-site tests                            |
| `npm run test:no-auth`            | Everything **except** `@auth` (the `chromium` project)    |
| `npm run report`                  | Open the last HTML report                                 |
| `npm run codegen`                 | Record a new test from clicks                             |
| `npm run typecheck`               | Type-check the whole project (`tsc --noEmit`)             |
| `npm run lint`                    | ESLint (TypeScript + Playwright rules)                    |
| `npm run format` / `format:check` | Apply / verify Prettier formatting                        |
| `npm run check`                   | The full static gate: type-check + lint + format check    |

Anything Playwright supports works too, e.g.:

```bash
npx playwright test tests/login.spec.ts          # one file
npx playwright test -g "category CRUD"           # by title
npx playwright test --debug                       # step through with Inspector
```

---

## 🎛️ Configuration (`.env`)

Every value is read once, **trimmed**, and typed. No value ever needs to be passed as a shell flag.

| Variable                         | Default                 | Purpose                                                |
| -------------------------------- | ----------------------- | ------------------------------------------------------ |
| `BASE_URL`                       | `http://localhost:5000` | Where the Scriptly app is running                      |
| `SITE_SLUG`                      | `demo`                  | Public-site slug (public tests self-skip if it 404s)   |
| `DEFAULT_TIMEOUT`                | `30000`                 | Action / navigation / `expect` timeout (ms)            |
| `TEST_EMAIL` / `TEST_PASSWORD`   | _(blank)_               | Tier 2 credentials — blank ⇒ `@auth` tests skip        |
| `RUN_EXPENSIVE`                  | _(unset)_               | Set to `1` to run paid AI tests (`@expensive`)         |
| `HEADED`                         | `false`                 | Show the browser (always headless in CI)               |
| `BROWSER_CHANNEL`                | _(bundled)_             | Use an installed browser, e.g. `chrome`, `msedge`      |
| `SLOW_MO`                        | `0`                     | Delay each action by N ms so a headed run is watchable |
| `MAXIMIZED`                      | `false`                 | Launch the window maximized (drops the fixed viewport) |
| `WINDOW_WIDTH` / `WINDOW_HEIGHT` | `1920` / `1080`         | Viewport / window size                                 |

> **Watch a run in real Chrome, maximized at 1920×1080, slowed down:**
> put this in `.env` and run `npm test` — no CLI flags needed.
>
> ```env
> HEADED=true
> BROWSER_CHANNEL=chrome
> MAXIMIZED=true
> SLOW_MO=500
> ```

---

## 🏗️ How it's wired

### Projects (see [`playwright.config.ts`](playwright.config.ts))

| Project         | Runs                                                                              | Auth                                |
| --------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| `setup`         | [`tests/auth.setup.ts`](tests/auth.setup.ts) — logs in once, saves `storageState` | —                                   |
| `chromium`      | every test **without** `@auth` (`grepInvert: /@auth/`)                            | none                                |
| `authenticated` | every `@auth` test, reusing the saved session                                     | `storageState` (depends on `setup`) |

When no credentials are configured, `setup` writes an **empty** storage state and skips, and each
`@auth` test skips itself — so the suite stays green with zero credentials, exactly like a fresh CI run.

### Layout

```
playwright.config.ts        # projects, reporters, tracing, env-driven use{}
src/
  config/env.ts             # single trimmed, typed config from .env
  data/endpoints.ts         # the full endpoint catalog + verified JSON shapes
  data/test-data.ts         # static inputs, routes, message fixtures
  api/                       # typed API service layer (read-back lives here)
    api-client.ts           #   base request/JSON wrapper
    types.ts                #   Blog / Category / response types
    blog-api.ts             #   blog pipeline + list/get/statusOf read-backs
    category-api.ts         #   category CRUD + exists()/pageShows() read-backs
  pages/                     # Page Object Model — one class per screen
  fixtures.ts               # test extended with page objects + API clients
  utils/helpers.ts          # async-task poller, etc.
tests/
  auth.setup.ts             # the login setup project
  *.spec.ts                 # the specs (tagged @smoke / @auth / @public / @expensive)
eslint.config.mjs           # flat ESLint config (TS + Playwright)
.prettierrc.json            # formatting rules
.github/workflows/playwright.yml
```

### Read-back verification (how a mutation is _proved_)

A mutation's own `success: true` is treated as a claim, not a fact. Each write is
confirmed against an independent read:

| Mutation        | Claim                     | Read-back that proves it                                                                          |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| Create category | `201`-ish `{success, id}` | `GET /api/category/<id>/blogs` now returns `200`                                                  |
| Rename category | `{success:true}`          | the new name is what `/categories` renders (old name gone)                                        |
| Delete category | `{success:true}`          | the existence probe now returns `404`                                                             |
| Publish blog    | `{success:true}`          | the blog's status re-reads as `PUBLISHED`, the public post page returns `200` and shows the title |

Because the app has no JSON _list-categories_ endpoint, and a non-admin only sees
categories that already have blogs, the name-level rename check is applied only when
the account actually renders the category — the id-level existence probe always runs.

---

## 🏷️ Test tags

Filter any run with `--grep` / `--grep-invert`:

| Tag          | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| `@smoke`     | Fast, high-value checks that should always pass         |
| `@auth`      | Tier 2 — needs real Firebase credentials                |
| `@public`    | Public-facing blog-site tests                           |
| `@expensive` | Spends paid AI quota — only runs with `RUN_EXPENSIVE=1` |

---

## 🤖 Continuous integration

[`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) runs on every push and PR to
`main`/`master` in two stages: a fast **static-checks** gate (type-check → lint → format) that must
pass first, then the **Playwright suite**, which uploads the HTML report + JUnit XML as an artifact.
It triggers on changes to `tests/**`, `src/**`, and the config/lockfiles — so a change to a page
object or the API layer is covered, not just changes under `tests/`.

Configure these **repository secrets** so CI can reach your deployment (and, optionally, run the
`@auth` tier):

| Secret                        | Needed for                                     |
| ----------------------------- | ---------------------------------------------- |
| `BASE_URL`                    | pointing CI at a reachable Scriptly deployment |
| `TEST_EMAIL`, `TEST_PASSWORD` | the `@auth` tier (omit ⇒ those tests skip)     |
| `SITE_SLUG`                   | the `@public` tier                             |

---

## 📊 Reports & artifacts

After any run:

- **HTML report** → `reports/html` (`npm run report` to open)
- **JUnit XML** → `reports/junit.xml` (CI-friendly)
- **On failure** → screenshot, video, and a full `trace.zip` under `reports/artifacts/`
  (open a trace with `npx playwright show-trace <path>`)
