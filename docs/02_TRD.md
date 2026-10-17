# 02 — TRD: SNAPDESK

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14 App Router, TypeScript (strict) | Server actions + route handlers |
| Styling | Tailwind CSS + CSS variables, Poppins via `next/font/google` | Brutalist tokens in doc 04 |
| Validation | zod | All API inputs and all AI outputs |
| Data | Supabase Postgres + Auth + Storage (later); **mock repository now** | Repository pattern |
| AI | Gemini API serving Gemma 4 (`GEMMA_MODEL`) | `@google/genai` SDK or REST; provider interface |
| Agent layer | Hermes-style tool calling | Tool registry with role-gated tools |
| Email | Gmail API via OAuth (later); mock outbox now | Drafts only unless user confirms send |
| Tests | Vitest, React Testing Library, Playwright | See doc 06 |
| Deploy | Vercel (later) | Env vars set in dashboard |
| Package manager | pnpm | |

## 2. Architecture

```
Browser (Next.js UI, responsive)
   |
   |  fetch / server actions
   v
Next.js server (route handlers /api/*)
   |-- auth.ts           (session -> {userId, role, orgId})
   |-- policy.ts         (can(user, action, resource))
   |-- repo/             (interface + mock + supabase implementations)
   |-- ai/provider.ts    (interface) -> gemma.ts | mock.ts
   |-- ai/prompts/*.ts   (versioned prompts)
   |-- ai/schemas/*.ts   (zod schemas for AI outputs)
   |-- agent/runner.ts   (tool-calling loop)
   |-- agent/tools/*.ts  (role-gated tools)
   |-- gmail/client.ts   (real | mock)
   |-- payroll/engine.ts (pure functions)
   `-- audit.ts
        |
        v
Supabase (Postgres + RLS + Storage)   Gemini API (Gemma 4)   Gmail API
```

### 2.1 Repository pattern (enables mock-first)

```ts
// lib/repo/index.ts
export const repo: Repo = process.env.USE_MOCK === 'true' ? mockRepo : supabaseRepo;
```

- `Repo` interface covers: profiles, employees, documents, analyses, contracts, reminders, leaves, payroll, approvals, notifications, audit.
- Mock repo: in-memory store seeded from `lib/repo/mock/seed.ts`, persisted to `.data/mock.json` in dev so refreshes keep state. Seed includes 1 admin, 2 managers, 6 employees, sample documents, leave types, one published payroll run.
- Both implementations must pass the same contract tests (`repo.contract.test.ts`).

### 2.2 Auth

- **Mock:** `/login` shows "Continue as Admin / Manager / Employee" buttons (dev only, hidden when `USE_MOCK=false`). Session stored in signed cookie.
- **Real:** Supabase Auth (email + Google). `profiles.role` is the source of truth. Middleware refreshes session.
- Route guards in `middleware.ts` and again inside every route handler (defence in depth).

## 3. AI design

### 3.1 Provider interface

```ts
interface AIProvider {
  generateJSON<T>(args: {
    system: string;
    prompt: string;
    images?: { mimeType: string; dataBase64: string }[];
    schema: z.ZodType<T>;
    schemaName: string;
    timeoutMs?: number;
  }): Promise<AIResult<T>>;

  chat(args: { messages: Msg[]; tools?: ToolDef[] }): Promise<ChatResult>;
}
type AIResult<T> =
  | { ok: true; data: T; raw: string; latencyMs: number }
  | { ok: false; error: 'timeout' | 'invalid_json' | 'schema_mismatch' | 'provider_error'; raw?: string };
```

- `gemma.ts`: calls Gemini API with `model = process.env.GEMMA_MODEL`. Request JSON mode (`responseMimeType: 'application/json'`) with response schema where supported. Timeout 30 s.
- `mock.ts`: deterministic fixtures keyed by a hash of the file name/type so demos are repeatable (contract, bill, notice, ID fixtures included).
- **Retry policy:** on `invalid_json` or `schema_mismatch`, retry once with a repair prompt containing the validation errors. Then return `ok:false`; UI shows "Needs manual review" with the raw text hidden behind a toggle.

### 3.2 Document analysis pipeline

1. **Client:** capture/upload; compress image to <=1600 px, JPEG q0.8; basic blur check (Laplacian variance) -> warn "retake?"; PDF accepted up to 10 MB (first 5 pages rendered to images via `pdfjs-dist` client-side, or sent as PDF if the provider supports it).
2. **Upload:** to storage (mock: `.data/uploads`), create `documents` row with `status='uploaded'`.
3. **Classify + extract (single call):** output schema `DocAnalysis`:

```ts
const DocAnalysis = z.object({
  docType: z.enum(['contract','invoice','notice','id_document','payslip','other']),
  title: z.string().max(140),
  summary: z.string().max(1200),
  language: z.string(),
  fields: z.array(z.object({
    key: z.string(),                 // e.g. 'party_a', 'total_amount', 'due_date'
    value: z.string(),
    sourceSnippet: z.string().min(3),// REQUIRED: text visible in the doc
    confidence: z.number().min(0).max(1),
  })),
  deadlines: z.array(z.object({
    label: z.string(),
    date: z.string(),                // ISO yyyy-mm-dd; normalised by server
    sourceSnippet: z.string().min(3),
    confidence: z.number().min(0).max(1),
  })),
  risks: z.array(z.object({
    severity: z.enum(['low','medium','high']),
    category: z.enum(['auto_renewal','penalty','termination','liability','payment_terms','missing_signature','ambiguity','other']),
    explanation: z.string(),
    sourceSnippet: z.string().min(3),
    confidence: z.number().min(0).max(1),
  })),
  suggestedActions: z.array(z.enum(['create_reminder','draft_email','request_review','none'])),
  qualityIssues: z.array(z.string()),
});
```

4. **Post-process (server, deterministic):**
   - Drop any field/deadline/risk lacking `sourceSnippet`.
   - Normalise dates; drop impossible dates; mark past deadlines `overdue`.
   - Mask ID-like numbers (`XXXX-XXXX-1234`) before saving/displaying.
   - Store in `document_analyses` with `model`, `prompt_version`, `latency_ms`.
5. **UI:** result page shows summary, fields table, risk cards (severity color), deadlines with "Create reminder" buttons, "Draft email" button, "Request review" (creates approval for a manager/admin).

### 3.3 Identity verification assist

- Inputs: ID image + selfie image (both captured in-app; consent recorded).
- Prompt asks for: extracted visible fields (name, DOB, ID type, masked number), whether the ID appears to be a real photo of a card vs screenshot/photocopy (heuristic), whether the face appears visually consistent with the ID photo (`consistent | inconsistent | cannot_determine`), confidence, and reasons.
- Output stored as *advisory*. UI to admin shows both images and AI notes; admin clicks Approve/Reject. No automated state change.
- This is **not** biometric authentication. Disclaimer appears in UI and docs. No embeddings/templates stored.
- Retention: images deletable by admin; default retention config 90 days after decision (setting stored, job later).

### 3.4 Contract generation

- Admin provides role, salary, start date, notice period, probation, location.
- Templates in `lib/contracts/templates/*.md` with `{{variables}}`.
- Gemma optionally rewrites the "Responsibilities" paragraph from the job title; everything else is deterministic template fill. Output rendered as HTML, stored as `contracts.body_md`.
- Employee acceptance: typed full name must match profile name (case-insensitive); store timestamp, IP, user agent. Label: "Electronic acceptance (typed name)".

### 3.5 Agent (Hermes) design

**Loop (`agent/runner.ts`):**
1. Build system prompt: role, user name, today's date (server-injected), tool list, rules (never invent, cite doc ids, refuse out-of-scope requests).
2. Send user message + tool definitions.
3. If the model returns tool calls: validate args with zod, run `policy.can()`, execute, append result, loop. Max 5 iterations.
4. Return final answer + list of tool calls (for UI "show steps" panel).
5. Log run to `agent_runs`.

**Tools (all run server-side with the caller's identity; DB access goes through RLS-scoped client):**

| Tool | Roles | Description |
|---|---|---|
| `search_documents(query, docType?)` | all (own docs; manager: team; admin: all) | Full-text over titles/summaries/fields |
| `get_document_analysis(documentId)` | per policy | Returns stored analysis |
| `list_deadlines(range)` | all (scoped) | Upcoming deadlines from analyses + reminders |
| `create_reminder(title, dueAt, documentId?)` | all | Creates reminder for caller only |
| `draft_email(to, subject, bodyIntent, documentId?)` | all | Returns draft text; Gmail draft if connected |
| `get_leave_balance(userId?)` | self; manager: team; admin: all | |
| `apply_leave(typeId, from, to, reason)` | employee, manager | Creates pending request (needs UI confirm in v1: tool returns "proposed", UI confirms) |
| `list_pending_approvals()` | manager, admin | Scoped to approver |
| `get_payslip(month)` | self; admin: any | |
| `explain_payslip(month)` | self | Deterministic breakdown + model rephrase |
| `team_summary()` | manager, admin | Headcount, who is on leave this week |

**Consequential tools** (`apply_leave`, `draft_email` send) return `{ status:'proposed' }`; the UI shows a confirm card. The model cannot finalize them.

**Prompt-injection defence:** document text is wrapped in `<document>` tags and the system prompt states that text inside is data, never instructions. Tool args are validated; tools never accept arbitrary SQL or file paths.

## 4. Payroll engine (pure, unit-tested)

Inputs per employee for month M: `basic`, `hra`, `allowances[]`, `deductions[]`, `workingDays`, `unpaidLeaveDays`.

```
dailyRate      = (basic + hra + sum(allowances)) / workingDays
lopAmount      = round(dailyRate * unpaidLeaveDays)
gross          = basic + hra + sum(allowances) - lopAmount
totalDeduction = sum(deductions)        // flat/percentage items resolved to amounts first
net            = gross - totalDeduction
```

- Percentage deductions are `% of basic`. Round to 2 decimals using banker-safe integer paise math (store amounts as integer paise).
- Statutory items (PF, professional tax) are **configurable line items with demo defaults**, labelled "demo values, not compliance advice".
- Run states: `draft -> reviewed -> published`. Published runs are immutable (enforced in repo + DB trigger).

## 5. Gmail integration (later phase)

- Google OAuth 2.0 authorization code flow, scopes: `gmail.compose` (drafts/send) + `openid email profile`. Request incremental consent only when user clicks "Connect Gmail".
- Tokens encrypted (AES-256-GCM, `TOKEN_ENCRYPTION_KEY`) in `gmail_connections`.
- Routes: `/api/gmail/connect`, `/api/gmail/callback`, `/api/gmail/draft`, `/api/gmail/send`.
- Mock: writes to `.data/outbox.json`, UI shows identical "Draft created" state with a "Mock mode" badge.

## 6. API surface (route handlers, all return `{ ok, data | error }`)

| Method + path | Role | Purpose |
|---|---|---|
| POST `/api/documents` | any | Upload + create record |
| POST `/api/documents/:id/analyze` | owner/admin | Run analysis |
| GET `/api/documents` / `:id` | scoped | List / detail |
| POST `/api/reminders` | any | Create |
| GET `/api/reminders/run` | admin (dev) | Fire due reminders (cron later) |
| POST `/api/employees` | admin | Create employee + contract |
| GET/PATCH `/api/employees/:id` | admin; self read | |
| POST `/api/contracts/:id/accept` | employee (own) | E-accept |
| POST `/api/verification` | employee | Submit ID + selfie |
| POST `/api/leaves` | employee/manager | Apply |
| PATCH `/api/leaves/:id` | approver | approve/reject/cancel |
| GET `/api/approvals` | manager/admin | Inbox |
| PATCH `/api/approvals/:id` | approver | Decide |
| POST `/api/payroll/runs` | admin | Create draft run |
| PATCH `/api/payroll/runs/:id` | admin | Review/publish |
| GET `/api/payslips` | any (own) | |
| POST `/api/agent` | any | Chat |
| GET `/api/audit` | admin | Log |

Full table/column detail in `05_BACKEND_SCHEMA.md`.

## 7. Authorization matrix

| Resource | Employee | Manager | Admin |
|---|---|---|---|
| Own profile/documents/leaves/payslips | RW | RW | RW |
| Team members' docs/leaves | none | R (direct reports), approve leaves | R/W all |
| Contracts | R/accept own | R team | RW all |
| Identity verification | submit own | none | review all |
| Payroll runs | none | none | RW all |
| Role changes, user creation | none | none | yes |
| Audit log | none | none | R |

Enforced in three layers: UI hiding (convenience), route handler `policy.can`, DB RLS (truth).

## 8. Security

- Secrets only in env; never in client bundle (`NEXT_PUBLIC_` only for URL and anon key).
- File validation: type allowlist (jpeg, png, webp, pdf), size cap 10 MB, server-side MIME sniff.
- Private storage buckets; signed URLs expire in 5 minutes.
- CSRF: same-site cookies + origin check on mutating routes.
- Rate limiting on `/api/agent` and `/api/documents/:id/analyze` (in-memory token bucket now; Upstash/Vercel KV later).
- Security headers via `next.config.js` (CSP with self + supabase + google fonts, frame-ancestors none).
- Audit log append-only (no update/delete policy; trigger blocks updates).
- Logs never contain raw document text or full ID numbers.
- India DPDP Act awareness: consent screen, purpose statement, deletion path (documented in app footer/Privacy page).

## 9. Folder structure

```
snapdesk/
  app/
    (auth)/login/page.tsx
    (app)/layout.tsx                  # shell: sidebar/bottom nav by role
    (app)/dashboard/page.tsx
    (app)/scan/page.tsx               # snap-to-action
    (app)/documents/page.tsx, [id]/page.tsx
    (app)/approvals/page.tsx
    (app)/leaves/page.tsx, new/page.tsx
    (app)/payroll/page.tsx, [runId]/page.tsx
    (app)/payslips/page.tsx
    (app)/employees/page.tsx, new/page.tsx, [id]/page.tsx
    (app)/contracts/[id]/page.tsx
    (app)/verify/page.tsx
    (app)/assistant/page.tsx
    (app)/notifications/page.tsx
    (app)/audit/page.tsx
    (app)/settings/page.tsx
    api/...
  components/ui/                      # Button, Card, Input, Badge, Table, Modal, Tabs, Toast, EmptyState, Skeleton
  components/features/...
  lib/{auth,policy,audit,repo,ai,agent,gmail,payroll,contracts,utils}
  tests/{unit,integration,e2e}
  docs/
  PROGRESS.md
```

## 10. Performance and quality gates

- Client image compression before upload; lazy-load heavy pages; skeletons for async content.
- `pnpm build` must produce zero type errors and zero ESLint errors.
- Bundle: no chart library; no component library besides Tailwind utilities (keeps theme control and speed).

## 11. Observability

- `agent_runs` and `document_analyses` store model, latency, status.
- Simple `/settings/diagnostics` page (admin) showing mode (mock/live), model id, last 10 AI call statuses.

## 12. Assumptions

- Gemma 4 is reachable via Gemini API with image input and JSON output. If JSON mode is unavailable, prompt for JSON and parse with fence-stripping, then validate.
- Single-company tenancy (one org). `org_id` still exists in schema to avoid a rewrite later.
- Currency INR, dates in `Asia/Kolkata` for display, stored UTC.
