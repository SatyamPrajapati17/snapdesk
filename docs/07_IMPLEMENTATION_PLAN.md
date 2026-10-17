# 07 — IMPLEMENTATION PLAN: SNAPDESK

Executor: Hermes agent running Gemma 4. Read `00_README_AGENT.md` first.
Strategy: **vertical slices, mock-first, demo path early.** Each phase ends with an exit check. Run the self-healing loop from `06_TESTING.md` after every task.

Time-box guide (single focused builder/agent): total ~14-18 hours of work. Phases 0-5 produce a complete mock demo. Phases 6-8 go live after the human provides credentials.

Legend: **[T]** = write tests for it in the same task. **Exit** = must pass before moving on.

---

## Phase 0 — Scaffold (target: 30 min)

| # | Task |
|---|---|
| 0.1 | `pnpm create next-app snapdesk --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*"` |
| 0.2 | Install: `zod lucide-react clsx date-fns @google/genai @supabase/supabase-js @supabase/ssr`; dev: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright prettier` |
| 0.3 | Scripts in `package.json`: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:int` (vitest with node env config), `test:e2e` (`playwright test`), `verify` (lint && typecheck && test && test:int && build), `verify:full` |
| 0.4 | `.env.example` (from doc 00), `.gitignore` incl. `.data/`, `.env.local`, `test-results/`; copy the 8 docs into `/docs`; create `PROGRESS.md` (sections: Done, In progress, Blocked, Decisions) |
| 0.5 | Vitest + Playwright configs (5 viewport projects per doc 06; `webServer` runs dev with `USE_MOCK=true`; fail on console errors) |
| 0.6 | Smoke test: homepage renders; `pnpm verify` green |

**Exit:** `pnpm verify` green on empty scaffold; `git init` + first commit.

## Phase 1 — Design system + shell (target: 1.5 h)

| # | Task |
|---|---|
| 1.1 | Tailwind tokens + global CSS from doc 04 sections 1 and 8; Poppins via `next/font` (400-900) applied on `<html>` |
| 1.2 | Build `components/ui`: Button, Input, Textarea, Select, Card, Badge, Table (responsive -> cards), Modal/Drawer, Tabs, Toast, Skeleton, EmptyState, Banner, StatTile [T: render + a11y roles] |
| 1.3 | App shell: desktop sidebar, tablet rail, mobile bottom tab bar + "More" sheet, header with bell + role tag + MOCK badge; skip link |
| 1.4 | System pages: 403, 404, 500 |
| 1.5 | `/design` dev-only page showing every component (also used by theme e2e) |
| 1.6 | E2E: `theme.spec`, `responsive.spec` for `/design` and shell, `keyboard.spec` basics |

**Exit:** theme/responsive/a11y specs green on all 5 viewports.

## Phase 2 — Data layer + auth + roles (target: 1.5 h)

| # | Task |
|---|---|
| 2.1 | `lib/repo/types.ts` from doc 05; `Repo` interface; mock implementation with JSON persistence + `resetMock()`; seed per doc 05 section 6 |
| 2.2 | `lib/auth` mock session (signed cookie), `getSession()`, `requireRole()`; `/login` with role buttons (mock) |
| 2.3 | `middleware.ts` redirects; role-aware nav config; 403 handling |
| 2.4 | `lib/policy` with `can(user, action, resource)` and table-driven tests (>= 40 cases) [T] |
| 2.5 | `lib/audit` helper; `lib/notify` helper; API response helpers `ok()`/`fail()`; zod request parsing util |
| 2.6 | Repo contract tests [T] |
| 2.7 | Dashboard (3 role variants) using seed data |

**Exit:** `roles.spec` green; policy tests green; dashboard renders for each role at all viewports.

## Phase 3 — Hero: Snap-to-action (target: 2.5 h)

| # | Task |
|---|---|
| 3.1 | `lib/ai/provider.ts` interface, `mock.ts` (fixture-keyed, deterministic), `schemas/docAnalysis.ts`, `postprocess.ts` (drop unsupported items, date normalise, masking, overdue) [T: A1-A9] |
| 3.2 | Prompt `lib/ai/prompts/docAnalysis.v1.ts` (system + user template; document content treated as data; JSON only) |
| 3.3 | `gemma.ts` provider (Gemini API, `GEMMA_MODEL`, JSON mode, timeout, retry-with-repair, fence stripping). Unit test with mocked fetch [T] |
| 3.4 | Client image tools: compress to 1600 px, blur check, PDF handling |
| 3.5 | API: `POST /api/documents` (validation: type/size/MIME sniff, sha256 dedupe), `POST /api/documents/:id/analyze`, `GET` list/detail [T: I1, I8] |
| 3.6 | UI: `/scan` flow (capture/upload -> preview -> analyzing -> result), `/documents`, `/documents/[id]` with Summary/Fields/Risks/Deadlines/Original tabs, RiskCard, sticky action bar |
| 3.7 | Reminders: `POST /api/reminders`, `GET /api/reminders/run`, notification creation, reminder list in Notifications [T] |
| 3.8 | Draft email: modal + `lib/gmail/mock.ts` outbox + route `/api/gmail/draft` (mock) |
| 3.9 | Request review -> creates approval + notification |
| 3.10 | E2E `demo-employee.spec` incl. prompt-injection fixture |

**Exit:** demo path step 1 works at all viewports; AI failure state tested (force mock failure via fixture `fail.jpg`).

## Phase 4 — ERP core: employees, contracts, verification, approvals (target: 3 h)

| # | Task |
|---|---|
| 4.1 | Employees list/search/filter; multi-step New Employee form; profile tabs [T] |
| 4.2 | Contract templates + generator (`lib/contracts`), admin preview/edit, send; employee contract page with typed-name accept [T: I2] |
| 4.3 | Verification flow (consent -> ID -> selfie -> review -> submit); AI assist prompt `identityAssist.v1` + mock; admin review UI with disclaimer strip [T: I3] |
| 4.4 | Approvals inbox (tabs, cards, drawer/page, decision flow, notifications, audit) [T] |
| 4.5 | Onboarding checklist + employee status transitions |
| 4.6 | E2E `demo-onboarding.spec` |

**Exit:** demo path step 2 works; manager cannot access verification items (tested).

## Phase 5 — Leave, payroll, agent (target: 3.5 h)

| # | Task |
|---|---|
| 5.1 | `lib/leave` day calculator, validation, balance logic [T: L1-L9] |
| 5.2 | Leaves UI (balances, list, apply form, team calendar); approvals integration [T: I4]; `demo-leave.spec` |
| 5.3 | `lib/payroll/engine.ts` pure functions in integer paise [T: P1-P9] |
| 5.4 | Payroll UI: runs list, run detail, adjustments modal, review/publish with confirm, CSV export; payslips pages + print CSS [T: I5]; `demo-payroll.spec` |
| 5.5 | Agent: tool registry (doc 02 section 3.5), zod args, role gating, runner loop with max 5 iterations, mock chat provider that routes by keyword so the demo works offline, `agent_runs` log [T: G1-G7] |
| 5.6 | Assistant UI: chat, chips, steps panel, confirm cards for proposals |
| 5.7 | Audit page; Settings page (profile, company, integrations placeholder, diagnostics) |
| 5.8 | E2E `demo-agent.spec`, full `a11y.spec` + `responsive.spec` over all routes |

**Exit:** `pnpm verify:full` green; **mock demo complete** (demo path steps 1-5). Tag `v0.1-mock`.

## Phase 6 — Hardening (target: 1.5 h)

| # | Task |
|---|---|
| 6.1 | Rate limiting (in-memory token bucket) on agent + analyze [T: I7] |
| 6.2 | Security headers + CSP in `next.config`; CSRF origin check on mutations |
| 6.3 | Error boundaries, offline banner, `offline-error.spec` |
| 6.4 | Config validation (`lib/env.ts` zod): friendly screen if live mode lacks keys |
| 6.5 | Performance pass: lazy-load heavy components, image `sizes`, check Lighthouse targets |
| 6.6 | README with setup, mock/live switch, demo script (3-minute narration), architecture diagram |

**Exit:** quality gates in doc 06 section 9 pass (except live-integration items).

## --- HUMAN CHECKPOINT: provide credentials ---

Human supplies: Supabase URL/anon/service keys, Gemini API key + `GEMMA_MODEL`, Google OAuth client id/secret, Vercel access. Agent then proceeds with Phases 7-8. Until then, stay in mock mode and do NOT block.

## Phase 7 — Go live: Supabase + Gemma + Gmail (target: 2.5 h)

| # | Task |
|---|---|
| 7.1 | Create `supabase/migrations/0001_init.sql` from doc 05; apply; verify RLS enabled on all tables |
| 7.2 | `lib/repo/supabase.ts` implementing `Repo`; run repo contract tests against it |
| 7.3 | Supabase Auth: email + Google sign-in, profile bootstrap, middleware session refresh; hide mock login when `USE_MOCK=false` |
| 7.4 | Storage buckets + policies; switch uploads to Supabase Storage with signed URLs |
| 7.5 | Live Gemma provider smoke test on 3 fixtures; tune prompts if schema failures > 1/3; record latency in diagnostics page |
| 7.6 | Gmail OAuth: connect/callback routes, encrypted token storage, draft + send-after-confirm; mock fallback retained |
| 7.7 | RLS probe script + run the live test plan from doc 06 section 8 |
| 7.8 | Google Sheets export (SHOULD) if time permits |

**Exit:** demo path works with `USE_MOCK=false`; RLS probes all deny correctly.

## Phase 8 — Deploy on Vercel (target: 45 min)

| # | Task |
|---|---|
| 8.1 | Set env vars in Vercel; add Google OAuth redirect URIs (prod + preview) |
| 8.2 | `vercel.json` cron for `/api/reminders/run` (daily) with `CRON_SECRET` check |
| 8.3 | Deploy; run Playwright with `BASE_URL` against preview; fix issues |
| 8.4 | Seed demo data in the live project; verify role logins |
| 8.5 | Final: rehearse demo path, record backup demo video, update README with live URL |

**Exit:** live URL passes demo path; security headers verified.

---

## Demo script (3 minutes)

1. **(0:00)** Landing: "Snap it. Solve it." Powered by Gemma 4. Why open-weights matters for HR data.
2. **(0:20)** Employee: snap a contract photo -> risks and deadlines appear with source quotes -> create reminder -> draft email.
3. **(1:10)** Admin: create employee -> contract -> employee accepts -> ID + selfie -> admin approves (call out human-in-the-loop).
4. **(1:50)** Leave: apply -> manager approves.
5. **(2:10)** Payroll: run, publish, employee payslip, "explain my payslip".
6. **(2:40)** Show phone view + role boundary (employee hits payroll -> NOT YOUR ZONE). Close with tests green and live URL.

## Cut list (if time runs short, drop in this order)

1. Google Sheets export 2. Hindi/Marathi summaries 3. CSV import 4. Team calendar month grid (keep week list) 5. Print CSS polish 6. Wide-screen extras.
**Never cut:** demo path, role boundaries, responsive, tests for payroll/policy/AI post-processing.

## Definition of done (project)

- Demo path passes in mock and live modes.
- `pnpm verify:full` green; quality gates in doc 06 section 9 met.
- Theme and responsive specs green on all 5 viewports.
- README + PROGRESS.md up to date; no secrets committed.
