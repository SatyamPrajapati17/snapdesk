# 03 — APP FLOW: SNAPDESK

Role-wise journeys, state machines, and agent flows. Screen layouts are in doc 04; data in doc 05.

## 1. Global flow

```
Landing (/)  ->  Login (/login)  ->  role check  ->  Dashboard (/dashboard)
                                        |
        +-------------------------------+-------------------------------+
        v                               v                               v
     Employee                        Manager                          Admin
```

- Unauthenticated users hitting any `(app)` route are redirected to `/login?next=<path>`.
- Authenticated users hitting a route their role cannot access see a **403 screen** (brutalist "NOT YOUR ZONE" page with a button back to dashboard), never a blank page.
- First login after account creation: if contract not accepted -> forced to `/contracts/:id` before other pages (banner on other pages, not hard lock, except Employee dashboard shows a big yellow "ACCEPT YOUR CONTRACT" card).

## 2. Navigation by role

| Item | Employee | Manager | Admin |
|---|---|---|---|
| Dashboard | yes | yes | yes |
| Scan (snap-to-action) | yes | yes | yes |
| Documents | own | own + team | all |
| Leaves | own | own + team approvals | all |
| Payslips | own | own | all (via payroll) |
| Payroll runs | no | no | yes |
| Employees | no | team (read) | yes (CRUD) |
| Approvals | no | yes | yes |
| Verify identity | yes (if pending) | yes (if pending) | yes (if pending) |
| Assistant | yes | yes | yes |
| Notifications | yes | yes | yes |
| Audit log | no | no | yes |
| Settings | profile | profile | profile + company + diagnostics + Gmail connect |

Desktop: left sidebar. Tablet: collapsible sidebar. Mobile: bottom tab bar with 4 key items + "More" sheet.

## 3. Flow A — Snap-to-action (hero)

```
[Scan page]
  choose: Camera (mobile) | Upload file
      v
  client: compress + blur check
      |-- blurry -> warning banner "Retake?" (user may continue)
      v
  POST /api/documents  -> status: uploaded
      v
  POST /api/documents/:id/analyze  -> status: analyzing (progress UI, skeleton)
      |-- ok -> status: analyzed -> [Result page]
      |-- ai failure -> status: needs_review -> [Result page w/ "Manual review" state + Retry button]
      v
  [Result page]
      Summary | Fields | Risks | Deadlines
      Actions:
        - Create reminder (per deadline)  -> POST /api/reminders -> toast + notification entry
        - Draft email                     -> modal: to, subject, body (editable) -> Gmail draft | mock outbox
        - Request review                  -> creates approval for manager/admin -> status: in_review
        - Delete document
```

**Document states:** `uploaded -> analyzing -> analyzed | needs_review -> in_review -> reviewed`

**Edge cases**
- Unsupported file -> inline error, no upload.
- File > 10 MB -> inline error with size shown.
- AI timeout -> `needs_review` + retry; after 3 manual retries show "Contact admin".
- Document type `id_document` detected on Scan page -> suggest using Verify flow, don't store extracted ID number unmasked.
- Duplicate upload (same hash) -> prompt "Open existing analysis?".

## 4. Flow B — Employee onboarding (Admin -> Employee)

```
Admin: Employees > New
   form: name, email, role, department, manager, job title, salary structure, start date, notice period, probation
      v
   POST /api/employees
      - creates auth user (mock: profile only; live: Supabase invite)
      - creates employee record, salary structure, leave balances
      - generates contract draft (status: draft)
      v
Admin: Contract preview (edit variables) -> "Send to employee"  (status: sent)
      v
Employee: login -> Dashboard card "Accept contract" -> /contracts/:id
      read full text -> type full name -> checkbox "I agree" -> Accept
      v
   status: accepted (timestamp, IP, UA stored) -> notification to admin
      v
Employee: Verify identity card appears (see Flow C)
      v
Admin: all checklist items done -> employee status: active
```

**Onboarding checklist (per employee):** contract accepted, identity verified, profile completed, bank details added (optional field, stored masked).
**Employee status:** `invited -> contract_pending -> verification_pending -> active | offboarded`.

## 5. Flow C — Identity verification (assist + human decision)

```
Employee: /verify
   Step 1: Consent screen (what is collected, why, who sees it, retention). Checkbox + "Continue".
   Step 2: Capture ID photo (camera/upload) with framing guide
   Step 3: Capture selfie (camera; fallback to upload)
   Step 4: Review both images -> Submit
      v
   POST /api/verification -> images to private storage, AI assist runs
      v
   verification status: submitted  (employee sees "Waiting for admin review")
      v
Admin: Approvals inbox -> item "Identity verification: <name>"
   sees: ID image, selfie, AI notes (extracted fields masked, consistency label, confidence, reasons), disclaimer
   decision: Approve | Reject (reason required) | Request retake
      v
   status: approved | rejected | retake_requested ; notification to employee ; audit log entry
```

AI result never changes status. If AI fails -> admin still sees images with "AI assist unavailable".

## 6. Flow D — Leave management

```
Employee: Leaves > Apply
   choose type, from, to, half-day option, reason
   client shows: working days count, remaining balance, overlap warning with team (names only count, e.g. "2 teammates on leave")
      v
   POST /api/leaves  -> status: pending ; approval item created for manager (or admin if applicant is manager / has no manager)
      v
Manager: Approvals inbox -> Approve | Reject (comment optional on approve, required on reject)
      v
   approved -> balance deducted (for paid types), employee notified, appears on team calendar
   rejected -> notified with reason
Employee may Cancel while pending, or approved-before-start (balance restored).
```

**Leave states:** `pending -> approved | rejected | cancelled`.
**Validation:** to >= from; no overlap with own approved leave; balance must cover paid leave (else option "apply as unpaid" which creates unpaid type); weekends and company holidays excluded from day count.

## 7. Flow E — Payroll

```
Admin: Payroll > New run (select month)
      v
   POST /api/payroll/runs -> engine computes payslips for all active employees
      uses: salary structure, unpaid leave days in month, deductions
      status: draft
      v
Admin: Run detail -> table of employees (gross, deductions, net) ; click row -> edit line items (adjustments) with reason
      v
   "Mark reviewed" (status: reviewed) -> "Publish" (confirm modal showing total net payout)
      v
   status: published (immutable) -> payslips visible to employees -> notification each -> audit log
Employee: Payslips > month -> breakdown, "Print/Download PDF", "Explain this payslip" (agent)
Admin: Export CSV (Google Sheets later)
```

**Payroll states:** `draft -> reviewed -> published`. Un-publish is NOT allowed; corrections go into next month as adjustment line items.

## 8. Flow F — Approvals inbox (unified)

Item types: `leave`, `identity_verification`, `document_review`, `contract_followup`.

```
Inbox tabs: Pending | Decided | All
Card: type badge, requester, summary, age, [Open] [Approve] [Reject]
Open -> detail drawer (desktop) / full page (mobile)
Decision -> comment -> confirm -> updates source entity + notifies requester + audit log
```

Visibility: Manager sees items from direct reports; Admin sees all (and manager-originated items).

## 9. Flow G — Agent chat

```
Assistant page: chat thread + suggestion chips (role-specific)
   Employee chips: "My upcoming deadlines", "Explain my last payslip", "My leave balance"
   Manager chips:  "Who is on leave this week?", "Pending approvals", "Team deadlines"
   Admin chips:    "Contracts expiring in 30 days", "Pending verifications", "Payroll status"
User sends message -> POST /api/agent
   server: build prompt -> model -> tool calls (validated, role-gated) -> final answer
   UI: shows answer + collapsible "Steps" panel (tool names + short results) + doc links
   Consequential proposals (apply leave, send email) render as a confirm card with Confirm / Cancel
Errors: model fail -> "Assistant is unavailable, try again" + retry; never show raw stack.
Out-of-scope request (e.g., employee asks for another's salary) -> assistant refuses politely; tool denies; audit entry "denied_tool_call".
```

## 10. Flow H — Reminders and notifications

- Reminder created from deadline or manually. Fields: title, due_at, source document, status (`scheduled|fired|dismissed`).
- `GET /api/reminders/run` (admin, dev button "Run due reminders") fires due reminders -> creates notification rows. Production: Vercel Cron hitting same endpoint with secret.
- Notification center: unread badge in header; mark read; click navigates to source.
- Notification types: approval_request, approval_decision, reminder, payslip_published, contract_sent, verification_update, system.

## 11. Flow I — Admin management

- Employees list: search, filter by dept/role/status; row -> profile (tabs: Overview, Contract, Documents, Leave, Salary).
- Role change: admin only, confirm modal, audit log.
- Departments and leave types CRUD (simple tables in Settings > Company).
- Audit log: filter by actor, action, date; read-only.
- Settings > Integrations: "Connect Gmail" (live) or "Mock mode" badge.

## 12. Empty, loading, error states (apply everywhere)

| State | Behavior |
|---|---|
| Loading | Brutalist skeleton blocks (solid gray-yellow stripes, no shimmer needed) |
| Empty | Large heading + one-line hint + primary action button |
| Error | Red bordered box, plain message, "Try again" button, error id for logs |
| Offline | Top yellow banner "YOU ARE OFFLINE"; mutating buttons disabled |
| Forbidden | 403 page |
| Not found | 404 page with link home |

## 13. Redirect and guard rules (testable)

| Scenario | Expected |
|---|---|
| Logged out opens `/payroll` | Redirect to `/login?next=/payroll` |
| Employee opens `/payroll` | 403 page |
| Manager opens another team's employee `/employees/:id` | 403 |
| Employee calls `GET /api/audit` | 403 JSON `{ok:false}` |
| Employee calls `PATCH /api/payroll/runs/:id` | 403 |
| Published payroll edit attempt | 409 `payroll_locked` |
