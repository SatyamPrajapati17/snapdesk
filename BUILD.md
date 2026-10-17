# SNAPDESK BUILD GUIDE (light version, for Hermes)

Project folder: `C:\NEW`. Specs: `C:\NEW\docs\01_PRD.md` ... `07_IMPLEMENTATION_PLAN.md`.

## What we are building

SnapDesk is a company ERP with three roles (admin, manager, employee) and a "snap a document" assistant. A user uploads a photo or PDF of a contract, bill or notice. The app shows the key fields, risky clauses and deadlines, and lets the user create a reminder or draft an email. The ERP part covers employees, contracts, ID check, leave, payroll, approvals and an assistant chat.

## How to work (read this first)

1. Do ONE stage at a time. When the stage is done, reply with 3 lines max (done / tests / problems) and STOP. I will say "next".
2. Do not read all the docs at once. Read only the doc sections named in the stage.
3. After each stage run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. If something fails, fix it and run again. After 5 tries on the same error, write it in `PROGRESS.md` under Blocked and tell me.
4. Never delete tests or hide errors. Commit after each stage with a clear message. Push to GitHub after each stage.
5. Keep replies short. No long explanations.

## Fixed decisions

- Stack: Next.js 14 (App Router), TypeScript, Tailwind, zod, pnpm. Supabase for backend. GitHub repo for code. I will deploy to Vercel myself later.
- Theme: Brutalism. Poppins font. Yellow `#FFD600`, red `#E10600`, white `#FFFFFF`, black `#0A0A0A`. No rounded corners, thick black borders, hard offset shadows (no blur), no gradients.
- Mobile friendly: must work at 360, 768, 1280 and 1920 px. No sideways scroll. Buttons at least 44 px tall. Mobile uses a bottom tab bar. Tables turn into cards on small screens.
- Login: our own email + password only. No Google sign-in.
- AI: use a mock AI by default (`AI_PROVIDER=mock`) that returns fixed sample results, so everything works with no key. Keep an `AIProvider` interface so a real model can be plugged in later by env.
- Safety: validate all AI output with zod. Drop any extracted item that has no source text. Mask ID numbers. Face/ID check is only a suggestion; an admin always decides. Show "Not legal advice" on contract risks.
- Permissions are checked in server code, never by the AI. Actions like applying leave or sending email are proposals the user must confirm.
- Secrets live only in `C:\NEW\.env.local`. Never print them, never commit them, never put them in code, README or chat. The repo is public.

## Demo logins (own login, for testing)

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.test | Admin@123 |
| Manager 1 (manages emp1-3) | manager1@demo.test | Manager@123 |
| Manager 2 (manages emp4-6) | manager2@demo.test | Manager@123 |
| Employee | emp1@demo.test ... emp6@demo.test | Employee@123 |

The login page has an email + password form and quick-fill buttons for each role.

## Stages

### Stage 1: Setup and look
Read: doc 07 Phase 0 and 1, doc 04 sections 1, 2, 3.
Do: create the Next.js app in `C:\NEW`, install packages, add scripts (`lint`, `typecheck`, `test`, `build`, `verify`), set `.gitignore` (include `.env.local`, `.data/`), create `PROGRESS.md`, `git init`, add remote `https://github.com/SatyamPrajapati17/snapdesk.git`. Build the theme and base components (Button, Input, Card, Badge, Table, Modal, Tabs, Toast) and the app shell (sidebar on desktop, bottom bar on mobile).
Done when: `pnpm build` passes and `pnpm dev` shows the themed shell at http://localhost:3000.

### Stage 2: Data, login, roles, dashboard
Read: doc 02 sections 2.1, 2.2, 7; doc 05 section 6 (seed data).
Do: a data layer with a `Repo` interface and an in-memory mock version saved to `.data/mock.json`; seed the demo users above plus sample data. Login page, session cookie, route guards, 403 page, role-based menu, three dashboards (admin / manager / employee). Add a `policy.can()` function with tests.
Done when: each demo login reaches its own dashboard, and an employee opening `/payroll` sees the 403 page.

### Stage 3: Snap-a-document (main feature)
Read: doc 02 section 3.1 and 3.2; doc 03 Flow A; doc 04 section 5.4.
Do: scan page (upload/camera, preview), upload API with type and size checks, mock AI that returns sample fields, risks and deadlines, result page with tabs (Summary, Fields, Risks, Deadlines), "Create reminder", "Draft email" (mock outbox), documents list, notifications page.
Done when: an employee uploads any image, sees results, creates a reminder and sees the email draft.

### Stage 4: Employees, contract, ID check, approvals
Read: doc 03 Flow B, C, F; doc 04 sections 5.6, 5.10 to 5.12.
Do: admin creates an employee, a contract is generated from a template, the employee accepts by typing their name, ID + selfie upload with a consent step, approvals inbox (admin decides, manager cannot see ID checks).
Done when: the full onboarding path works end to end.

### Stage 5: Leave and payroll
Read: doc 03 Flow D, E; doc 02 section 4; doc 06 sections 4.1 and 4.2 (test cases).
Do: leave apply and approve with balances, payroll run (draft, reviewed, published), payslip page with a print view, payroll math in whole paise with unit tests.
Done when: leave and payroll tests pass and the demo flows work.

### Stage 6: Assistant chat and audit log
Read: doc 02 section 3.5; doc 03 Flow G.
Do: assistant chat with a small set of role-limited tools (my deadlines, my leave balance, pending approvals, team on leave) using the mock AI, audit log page (admin only), settings page.
Done when: the chat answers role-scoped questions and denied requests are refused and logged.

### Stage 7: Supabase backend
Read: doc 05 (all).
Do: create `supabase/migrations/0001_init.sql` from doc 05 and apply it using `DATABASE_URL` from `.env.local`. If the connection fails, tell me and I will paste the SQL into the Supabase SQL editor. Write the Supabase version of `Repo`, switch login to Supabase email + password, seed the demo users with the admin API, add private storage buckets. Keep `USE_MOCK=true` working as a fallback.
Done when: the demo path works with `USE_MOCK=false`.

### Stage 8: Polish, README, deploy guide, push
Do: responsive and a11y check of every page, final `pnpm verify`. Write `README.md` (what SnapDesk is, features, how it uses AI, roles table, demo logins, quick start, env var names with no values, project structure, security notes, hackathon credit: Hacktoberfest Hack Day Nagpur x AWS SBG RTMSSU). Write `DEPLOY.md` (Vercel steps, env var names, Supabase URL settings). Run a secret scan before pushing: `git grep -nE "(eyJhbGci|sb_secret|service_role|postgres://|postgresql://)"` must find nothing. Tag `v1.0`, push.
Done when: everything is pushed to GitHub and the app runs at http://localhost:3000.

## Env var names (values are in `.env.local` only)

`USE_MOCK`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GEMMA_MODEL`
