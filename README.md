
# ⚡ SNAPDESK
**Snap it. Solve it.**

SnapDesk is a role-based company ERP designed for modern operational speed. It transforms static business documents into actionable data using an AI-powered snap-to-action assistant.

## 🚀 Key Features
- **AI Snap-to-Action Assistant**: Take a photo of a contract, bill, or notice $\rightarrow$ auto-extract fields, flag risks, identify deadlines, and draft response emails.
- **Role-Based ERP**:
  - **Admin**: Full oversight, employee onboarding, payroll execution, and audit logs.
  - **Manager**: Team management, leave approvals, and document review.
  - **Employee**: Personal dashboard, leave applications, payslip access, and AI document assistance.
- **Identity Verification Assist**: AI-powered ID and selfie matching (advisory only).
- **Automated Payroll**: One-click payroll generation and publishing.
- **Agent Chat**: Role-scoped AI assistant for instant company info.

## 🤖 AI Implementation
SnapDesk uses a pluggable `AIProvider` interface:
- **Providers**: Supports Anthropic (Claude), Google (Gemini), and a Mock provider for development.
- **Safety**: All model outputs are Zod-validated. Extracted data requires a source snippet for verification.
- **Privacy**: ID numbers are masked; documents are treated as data, never as instructions.
- **Disclaimer**: Identity checks are advisory; a human admin always makes the final decision. Contract risks are marked as "Not legal advice".

## 🛠 Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Zustand.
- **Backend**: Supabase (PostgreSQL, Auth, Storage).
- **AI**: Anthropic SDK / Google Gemini API.
- **Styling**: Brutalist Design System.

## 🔑 Roles & Permissions
| Feature | Employee | Manager | Admin |
|---|:---:|:---:|:---:|
| Document Upload/Analyze | ✅ | ✅ | ✅ |
| Apply for Leave | ✅ | ✅ | ✅ |
| Approve Leave | ❌ | ✅ | ✅ |
| Run Payroll | ❌ | ❌ | ✅ |
| View Audit Log | ❌ | ❌ | ✅ |
| Manage Employees | ❌ | ❌ | ✅ |

## 👥 Demo Accounts
*Note: Demo accounts only.*
- **Admin**: `admin@demo.test` / `Admin@123`
- **Managers**: `manager1@demo.test`, `manager2@demo.test` / `Manager@123`
- **Employees**: `emp1@demo.test` ... `emp6@demo.test` / `Employee@123`

## 🏁 Quick Start
1. `pnpm install`
2. `cp .env.example .env.local` (Fill in your Supabase keys)
3. `pnpm dev`
4. Visit `http://localhost:3000`

## 📦 Environment Variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Server-side only) |
| `DATABASE_URL` | Direct Postgres connection string |
| `AI_PROVIDER` | `mock`, `anthropic`, or `gemma` |
| `ANTHROPIC_API_KEY` | Key for Claude models |
| `GEMINI_API_KEY` | Key for Gemini models |

## 🛡 Security & Privacy
- **RLS**: Row Level Security enforced at the database level.
- **Encryption**: Gmail tokens encrypted via `TOKEN_ENCRYPTION_KEY`.
- **Audit**: Every consequential action is logged in the immutable audit trail.

## 🚀 Deployment
See [DEPLOY.md](DEPLOY.md) for Vercel deployment steps.

---
**Hackathon Credit**: Hacktoberfest Hack Day Nagpur x AWS SBG RTMSSU.
