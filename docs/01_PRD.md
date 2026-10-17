# 01 — PRD: SNAPDESK

**One-liner:** Snap a photo of any work document, and an AI agent turns it into action, inside a role-based company ERP that handles onboarding, leaves, payroll and approvals.

**Hackathon target:** Hacktoberfest Hack Day Nagpur x AWS SBG RTMSSU, prize category *Best Use of Gemma 4*.

---

## 1. Problem

Small and mid-size companies run HR and admin on paper, WhatsApp photos and scattered email. Documents (contracts, bills, notices, IDs) get lost, deadlines are missed, risky clauses go unnoticed, and managers/admins waste hours on onboarding, leave and payroll paperwork. Existing ERPs are heavy, expensive and don't understand documents.

## 2. Vision

A lightweight ERP where **documents are the interface**. Photograph it, the system understands it, routes it to the right person, and does the follow-up (reminder, email draft, approval request).

## 3. Why Gemma 4 (judging story)

- **Multimodal:** reads photos of documents and ID/selfie images directly.
- **Open weights:** company HR/contract data is sensitive; the same prompts can move to a self-hosted Gemma 4 later without redesign (model behind a provider interface).
- **Lightweight:** cheap enough for small businesses.
- **Rapid prototyping:** Gemini API access makes it demoable today.

## 4. Users and roles

| Role | Who | Core needs |
|---|---|---|
| **Admin** | Owner / HR head | Manage company, users, roles, contracts, payroll, verifications, audit |
| **Manager** | Team lead | Approve team leaves, view team docs, review team requests, team dashboard |
| **Employee** | Staff | Accept contract, upload docs, apply leave, see payslips, scan documents |

Access rules are in `02_TRD.md` section 7 and enforced by RLS.

## 5. Scope

### 5.1 MUST (hackathon MVP)

**M1. Auth and roles**
- Email login (mock now; Supabase Auth + Google sign-in later). Roles: admin, manager, employee. Role-based nav and route guards.

**M2. Snap-to-action Document Assistant (hero feature)**
- Upload/capture image or PDF (camera capture on mobile).
- Gemma 4 classifies doc type (contract, bill/invoice, notice, ID, payslip, other).
- Extracts structured fields (parties, amounts, dates, due dates, clauses, ID numbers masked).
- Flags risks: auto-renewal, penalties, unilateral termination, missing signatures, unusually high liability, short notice periods. Each flag cites the source text snippet and a confidence.
- Detects deadlines and creates reminders (user confirms).
- Generates plain-language summary (English; Hindi/Marathi optional toggle).
- Drafts an email (Gmail draft once OAuth connected; copy-to-clipboard in mock).
- Saves to Documents with analysis history.

**M3. Employee onboarding**
- Admin creates employee -> system generates contract from template (AI fills variables, admin reviews) -> employee views, accepts (typed-name e-accept + timestamp) -> contract stored.
- Identity verification: employee uploads ID photo + live selfie -> Gemma 4 gives a *visual consistency assessment* and basic ID field extraction -> **always routed to Admin for manual approval**. Not an auto-decision. Explicit consent screen before capture.

**M4. Approvals inbox**
- Unified inbox for approvals (leave, identity verification, document review, contract acceptance follow-up). Approve / Reject with comment. Role-scoped.

**M5. Leave management**
- Leave types, balances, apply, cancel (if pending), approve/reject by manager (admin for managers), calendar view, overlap warning.

**M6. Payroll**
- Salary structure per employee (basic, HRA, allowances, deductions).
- Admin runs monthly payroll: computes gross, deductions, net, applies unpaid leave days. Draft -> Review -> Published.
- Employee sees payslip, can download PDF (print view), can ask the agent "explain my payslip".

**M7. Reminders and notifications**
- In-app notification center. Reminders table with due dates; daily check (cron later; "run now" button in mock).

**M8. Agent chat (Hermes)**
- Role-scoped assistant with tool calling: search documents, list deadlines, check leave balance, summarise payslip, draft email, create reminder.

**M9. Audit log**
- Immutable log of sensitive actions (visible to admin).

**M10. Brutalist UI, fully responsive.**

### 5.2 SHOULD (if time)

- Gmail OAuth: create drafts, send after user confirms.
- Google Sheets export (payroll, leave report).
- Hindi/Marathi summaries.
- Dashboard charts (simple bar blocks, no chart lib required).
- CSV bulk employee import.

### 5.3 WON'T (this version)

- Statutory compliance filings (PF/ESI/TDS filing), bank payouts, biometric hardware, legally binding e-signature (typed accept only, clearly labelled as such), multi-company tenancy.

## 6. User stories and acceptance criteria

| ID | Story | Acceptance criteria |
|---|---|---|
| US-1 | As an employee I photograph a contract and get risks and deadlines | Upload -> analysis in <20 s (mock <2 s); fields shown; >=1 risk flag with cited snippet when present; invalid AI output shows "manual review" state, never a crash |
| US-2 | As an employee I confirm a detected deadline as a reminder | Reminder created with title, due date, source doc link; appears in notifications at due time/when "run reminders" |
| US-3 | As an admin I onboard a new employee | Employee created, contract generated and visible to the employee, status flow tracked |
| US-4 | As an employee I submit ID + selfie | Consent shown first; images stored privately; request appears in admin approvals with AI assessment and confidence; no auto-approve |
| US-5 | As a manager I approve my team's leave | Only direct reports visible; approve updates balance; employee notified |
| US-6 | As an admin I run payroll | Draft computed correctly (see formulas in TRD); can edit line items; publish locks the run and notifies employees |
| US-7 | As an employee I ask "when is my notice period over?" | Agent answers only from that employee's own data and cites the document |
| US-8 | As anyone I use the app on a phone | No horizontal scroll; tap targets >=44 px; nav usable one-handed |
| US-9 | As an admin I view the audit log | Every approval, role change, payroll publish and verification decision appears with actor and time |

## 7. Non-functional requirements

- **Responsive:** 360 px to 1920 px, touch + mouse + keyboard.
- **Performance:** LCP < 2.5 s on mid-range phone; skeleton states; image compressed client-side to max 1600 px before upload.
- **Accessibility:** WCAG AA contrast, visible focus (thick outline fits brutalism), labels on all inputs, alt text.
- **Privacy:** sensitive docs private by default; ID images in private bucket with signed URLs; ID numbers masked in UI; consent recorded; data deletion path.
- **Reliability:** every AI call has timeout, retry-once, schema validation, graceful fallback.
- **Auditability:** all consequential actions logged.
- **Mock-first:** the whole demo path works with zero external credentials.

## 8. Success metrics (demo + judging)

- Demo path (section in doc 00) runs end-to-end without error in <5 minutes.
- Document analysis demonstrates 3 distinct document types.
- All role boundaries demonstrable (employee cannot open admin pages; direct URL blocked).
- Lighthouse >= 90 accessibility, >= 80 performance on key pages.
- All automated tests green.

## 9. AI safety and ethics requirements

- AI output is advisory; labelled "AI-suggested" in UI.
- Face/ID check is an *assist for a human reviewer*, not authentication or a biometric decision. Display a disclaimer. No face embeddings stored; only images in private storage with retention setting.
- No legal advice claims on contract risk flags; show "Not legal advice".
- PII masked in logs and prompts where possible; prompts never include other users' data.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Gemma 4 model id / API shape differs | Provider interface + env `GEMMA_MODEL`; mock provider default |
| Poor OCR on blurry photos | Client-side quality check (blur/size), "retake" prompt, confidence display |
| Hallucinated clauses | Require source snippet per field/flag; drop items without snippet |
| Scope creep | Follow phases in doc 07; SHOULD items only after demo path passes |
| Credentials arrive late | Mock adapters for DB, AI, Gmail |

## 11. Release plan

1. **v0.1 Mock demo** (no credentials) — hackathon safe fallback.
2. **v0.2 Supabase + Gemma live.**
3. **v0.3 Gmail OAuth + Vercel deploy.**
