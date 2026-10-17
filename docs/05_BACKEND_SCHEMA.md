# 05 — BACKEND SCHEMA: SNAPDESK (Supabase / Postgres)

Run order: extensions -> enums -> tables -> functions -> triggers -> RLS policies -> storage -> seed.
Put it in `supabase/migrations/0001_init.sql`. In mock mode the same entities exist as TypeScript types in `lib/repo/types.ts` (generate types from this doc's columns; keep names identical).

Conventions: `uuid` primary keys (`gen_random_uuid()`), `timestamptz` everywhere, money as **integer paise** (`bigint`), soft-delete only where stated, `org_id` on every business table.

## 1. Extensions and enums

```sql
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create type user_role         as enum ('admin','manager','employee');
create type employee_status   as enum ('invited','contract_pending','verification_pending','active','offboarded');
create type doc_type          as enum ('contract','invoice','notice','id_document','payslip','other');
create type doc_status        as enum ('uploaded','analyzing','analyzed','needs_review','in_review','reviewed');
create type contract_status   as enum ('draft','sent','accepted','expired','terminated');
create type leave_status      as enum ('pending','approved','rejected','cancelled');
create type approval_type     as enum ('leave','identity_verification','document_review','contract_followup');
create type approval_status   as enum ('pending','approved','rejected','retake_requested','cancelled');
create type verification_status as enum ('submitted','approved','rejected','retake_requested');
create type payroll_status    as enum ('draft','reviewed','published');
create type reminder_status   as enum ('scheduled','fired','dismissed');
create type notif_type        as enum ('approval_request','approval_decision','reminder','payslip_published','contract_sent','verification_update','system');
```

## 2. Tables

```sql
-- Organisation (single-tenant now, column kept for the future)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  unique (org_id, name)
);

-- One profile per auth user
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'employee',
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null unique references profiles(id) on delete cascade,
  employee_code text not null,
  department_id uuid references departments(id),
  manager_id uuid references profiles(id),            -- direct manager's profile id
  job_title text not null,
  status employee_status not null default 'invited',
  start_date date not null,
  notice_period_days int not null default 30,
  probation_months int not null default 3,
  phone text,
  bank_account_masked text,                           -- e.g. XXXXXX1234 only
  onboarding jsonb not null default '{"contract_accepted":false,"identity_verified":false,"profile_completed":false}',
  created_at timestamptz not null default now(),
  unique (org_id, employee_code)
);
create index on employees (manager_id);

create table salary_structures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  basic_paise bigint not null check (basic_paise >= 0),
  hra_paise bigint not null default 0 check (hra_paise >= 0),
  allowances jsonb not null default '[]',   -- [{name, amount_paise}]
  deductions jsonb not null default '[]',   -- [{name, kind:'flat'|'percent_basic', value}]  value = paise or percent*100
  effective_from date not null,
  created_at timestamptz not null default now()
);
create index on salary_structures (employee_id, effective_from desc);

-- Documents and AI analyses
create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  doc_type doc_type not null default 'other',
  status doc_status not null default 'uploaded',
  storage_path text not null,
  mime_type text not null,
  size_bytes int not null,
  sha256 text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, sha256)
);
create index on documents (org_id, owner_id, created_at desc);

create table document_analyses (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  model text not null,
  prompt_version text not null,
  result jsonb not null,                    -- validated DocAnalysis (see TRD)
  search_text text not null default '',     -- title + summary + field values, for search
  risk_count int not null default 0,
  next_deadline date,
  ok boolean not null default true,
  error text,
  latency_ms int,
  created_at timestamptz not null default now()
);
create index on document_analyses (document_id, created_at desc);
create index on document_analyses using gin (search_text gin_trgm_ops);

-- Contracts
create table contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  version int not null default 1,
  body_md text not null,
  variables jsonb not null,
  status contract_status not null default 'draft',
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_name text,
  accepted_ip text,
  accepted_user_agent text,
  end_date date,
  created_at timestamptz not null default now()
);

-- Identity verification (assistive; human decides)
create table identity_verifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  id_image_path text not null,
  selfie_image_path text not null,
  consent_at timestamptz not null,
  ai_result jsonb,                          -- {fields[], consistency, confidence, reasons[]}  ADVISORY ONLY
  status verification_status not null default 'submitted',
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  decision_note text,
  delete_after timestamptz,
  created_at timestamptz not null default now()
);

-- Leaves
create table leave_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  paid boolean not null default true,
  annual_quota numeric(5,1) not null default 0,
  unique (org_id, name)
);

create table leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id) on delete cascade,
  year int not null,
  total numeric(5,1) not null,
  used numeric(5,1) not null default 0,
  unique (employee_id, leave_type_id, year),
  check (used >= 0)
);

create table holidays (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  day date not null,
  name text not null,
  unique (org_id, day)
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  leave_type_id uuid not null references leave_types(id),
  from_date date not null,
  to_date date not null,
  half_day boolean not null default false,
  days numeric(5,1) not null check (days > 0),
  reason text,
  status leave_status not null default 'pending',
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  check (to_date >= from_date)
);
create index on leave_requests (employee_id, from_date);

-- Approvals (unified inbox)
create table approvals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  type approval_type not null,
  entity_id uuid not null,                  -- leave_requests.id | identity_verifications.id | documents.id | contracts.id
  requester_id uuid not null references profiles(id) on delete cascade,
  approver_id uuid references profiles(id), -- null = any admin
  summary text not null,
  status approval_status not null default 'pending',
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index on approvals (approver_id, status);
create index on approvals (requester_id);

-- Payroll
create table payroll_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  month date not null,                      -- first day of month
  status payroll_status not null default 'draft',
  working_days int not null,
  total_gross_paise bigint not null default 0,
  total_deductions_paise bigint not null default 0,
  total_net_paise bigint not null default 0,
  created_by uuid not null references profiles(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, month)
);

create table payslips (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  run_id uuid not null references payroll_runs(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  basic_paise bigint not null,
  hra_paise bigint not null,
  allowances jsonb not null default '[]',
  deductions jsonb not null default '[]',   -- resolved amounts [{name, amount_paise}]
  adjustments jsonb not null default '[]',  -- [{name, amount_paise, reason}] +/-
  unpaid_leave_days numeric(5,1) not null default 0,
  lop_paise bigint not null default 0,
  gross_paise bigint not null,
  total_deductions_paise bigint not null,
  net_paise bigint not null,
  created_at timestamptz not null default now(),
  unique (run_id, employee_id)
);

-- Reminders, notifications
create table reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  document_id uuid references documents(id) on delete set null,
  status reminder_status not null default 'scheduled',
  created_at timestamptz not null default now()
);
create index on reminders (status, due_at);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  type notif_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on notifications (user_id, read_at, created_at desc);

-- Gmail
create table gmail_connections (
  user_id uuid primary key references profiles(id) on delete cascade,
  email text not null,
  refresh_token_enc text not null,          -- AES-256-GCM
  scopes text[] not null,
  created_at timestamptz not null default now()
);

-- Agent + audit
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  question text not null,
  answer text,
  tool_calls jsonb not null default '[]',
  status text not null default 'ok',
  latency_ms int,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,                     -- e.g. 'payroll.publish', 'role.change', 'verification.approve', 'tool.denied'
  entity_type text,
  entity_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on audit_logs (org_id, created_at desc);
```

## 3. Helper functions and triggers

```sql
-- Current user's org and role (SECURITY DEFINER so policies can call without recursion)
create or replace function auth_org() returns uuid language sql stable security definer set search_path = public as
$$ select org_id from profiles where id = auth.uid() $$;

create or replace function auth_role() returns user_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function is_admin() returns boolean language sql stable as $$ select auth_role() = 'admin' $$;

-- Is target profile a direct report of the current user?
create or replace function is_my_report(target uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from employees e where e.profile_id = target and e.manager_id = auth.uid()) $$;

-- Employee id helper
create or replace function my_employee_id() returns uuid language sql stable security definer set search_path = public as
$$ select id from employees where profile_id = auth.uid() $$;

-- Audit log is append-only
create or replace function block_audit_mutation() returns trigger language plpgsql as
$$ begin raise exception 'audit_logs is append-only'; end $$;
create trigger audit_no_update before update or delete on audit_logs
  for each row execute function block_audit_mutation();

-- Published payroll is immutable
create or replace function block_published_payroll() returns trigger language plpgsql as
$$ begin
  if (select status from payroll_runs where id = coalesce(new.run_id, old.run_id)) = 'published' then
    raise exception 'payroll_locked';
  end if;
  return coalesce(new, old);
end $$;
create trigger payslips_locked before update or delete on payslips
  for each row execute function block_published_payroll();

-- Prevent role escalation: only admins can change role
create or replace function guard_role_change() returns trigger language plpgsql as
$$ begin
  if new.role <> old.role and not is_admin() then
    raise exception 'only admin can change role';
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on profiles
  for each row execute function guard_role_change();

-- Auto-create profile on signup (live mode). First user in an org becomes admin via seed/invite, not here.
```

## 4. Row Level Security

Enable RLS on **every** table. Pattern: org match AND (own OR manager-of OR admin).

```sql
alter table organizations          enable row level security;
alter table departments            enable row level security;
alter table profiles               enable row level security;
alter table employees              enable row level security;
alter table salary_structures      enable row level security;
alter table documents              enable row level security;
alter table document_analyses      enable row level security;
alter table contracts              enable row level security;
alter table identity_verifications enable row level security;
alter table leave_types            enable row level security;
alter table leave_balances         enable row level security;
alter table holidays               enable row level security;
alter table leave_requests         enable row level security;
alter table approvals              enable row level security;
alter table payroll_runs           enable row level security;
alter table payslips               enable row level security;
alter table reminders              enable row level security;
alter table notifications          enable row level security;
alter table gmail_connections      enable row level security;
alter table agent_runs             enable row level security;
alter table audit_logs             enable row level security;

-- profiles: see colleagues in org (names for directory), edit self (not role), admin edits all
create policy profiles_select on profiles for select using (org_id = auth_org());
create policy profiles_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on profiles for all using (is_admin() and org_id = auth_org());

-- employees: self, manager of, admin
create policy emp_select on employees for select using (
  org_id = auth_org() and (profile_id = auth.uid() or manager_id = auth.uid() or is_admin()));
create policy emp_admin_write on employees for all using (is_admin() and org_id = auth_org());

-- salary: self read, admin all (managers cannot see)
create policy sal_self on salary_structures for select using (
  employee_id = my_employee_id() or (is_admin() and org_id = auth_org()));
create policy sal_admin_write on salary_structures for all using (is_admin() and org_id = auth_org());

-- documents: owner, manager of owner, admin
create policy doc_select on documents for select using (
  org_id = auth_org() and (owner_id = auth.uid() or is_my_report(owner_id) or is_admin()));
create policy doc_insert on documents for insert with check (owner_id = auth.uid() and org_id = auth_org());
create policy doc_update on documents for update using (owner_id = auth.uid() or is_admin());
create policy doc_delete on documents for delete using (owner_id = auth.uid() or is_admin());

create policy ana_select on document_analyses for select using (
  exists (select 1 from documents d where d.id = document_id and
    (d.owner_id = auth.uid() or is_my_report(d.owner_id) or is_admin())));
-- inserts to analyses happen via service role from the server only (no insert policy)

-- contracts: employee own, manager of, admin; employee may update only via accept endpoint (service role)
create policy con_select on contracts for select using (
  org_id = auth_org() and (employee_id = my_employee_id() or
    exists (select 1 from employees e where e.id = employee_id and e.manager_id = auth.uid()) or is_admin()));
create policy con_admin_write on contracts for all using (is_admin() and org_id = auth_org());

-- identity verification: employee inserts/reads own; admin reads/decides; managers have NO access
create policy iv_self_select on identity_verifications for select using (
  employee_id = my_employee_id() or (is_admin() and org_id = auth_org()));
create policy iv_self_insert on identity_verifications for insert with check (employee_id = my_employee_id());
create policy iv_admin_update on identity_verifications for update using (is_admin() and org_id = auth_org());

-- leave types/holidays/balances
create policy lt_select on leave_types for select using (org_id = auth_org());
create policy lt_admin on leave_types for all using (is_admin() and org_id = auth_org());
create policy hol_select on holidays for select using (org_id = auth_org());
create policy hol_admin on holidays for all using (is_admin() and org_id = auth_org());
create policy lb_select on leave_balances for select using (
  employee_id = my_employee_id() or is_admin() or
  exists (select 1 from employees e where e.id = employee_id and e.manager_id = auth.uid()));
-- balance writes via service role / security-definer function on approval

-- leave requests
create policy lr_select on leave_requests for select using (
  org_id = auth_org() and (employee_id = my_employee_id() or is_admin() or
    exists (select 1 from employees e where e.id = employee_id and e.manager_id = auth.uid())));
create policy lr_insert on leave_requests for insert with check (employee_id = my_employee_id());
create policy lr_update on leave_requests for update using (
  employee_id = my_employee_id() or is_admin() or
  exists (select 1 from employees e where e.id = employee_id and e.manager_id = auth.uid()));

-- approvals: requester, assigned approver, admin
create policy ap_select on approvals for select using (
  org_id = auth_org() and (requester_id = auth.uid() or approver_id = auth.uid() or is_admin()));
create policy ap_update on approvals for update using (approver_id = auth.uid() or is_admin());
-- inserts via service role in server routes

-- payroll: admin all; employees read own published payslips only
create policy pr_admin on payroll_runs for all using (is_admin() and org_id = auth_org());
create policy ps_admin on payslips for all using (is_admin() and org_id = auth_org());
create policy ps_self on payslips for select using (
  employee_id = my_employee_id() and
  exists (select 1 from payroll_runs r where r.id = run_id and r.status = 'published'));

-- reminders, notifications, gmail, agent: own only
create policy rem_own on reminders for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy not_own on notifications for select using (user_id = auth.uid());
create policy not_own_update on notifications for update using (user_id = auth.uid());
create policy gm_own on gmail_connections for select using (user_id = auth.uid());
create policy agent_own on agent_runs for select using (user_id = auth.uid() or is_admin());

-- audit: admin read only; inserts via service role
create policy audit_admin_read on audit_logs for select using (is_admin() and org_id = auth_org());

-- organizations / departments
create policy org_select on organizations for select using (id = auth_org());
create policy dept_select on departments for select using (org_id = auth_org());
create policy dept_admin on departments for all using (is_admin() and org_id = auth_org());
```

> Server routes use the **user-scoped** Supabase client for reads (RLS applies). The **service-role client** is used only for: AI result inserts, approvals/notification inserts, balance updates, audit inserts, contract acceptance, and always after an explicit `policy.can()` check in code.

## 5. Storage

Buckets (all **private**):

| Bucket | Path pattern | Access |
|---|---|---|
| `documents` | `{org_id}/{owner_id}/{uuid}.{ext}` | owner, manager of owner, admin via signed URL |
| `identity` | `{org_id}/{employee_id}/{uuid}-{id|selfie}.jpg` | employee (upload own), admin (read) |
| `avatars` | `{org_id}/{user_id}.jpg` | org members |

```sql
create policy "docs read" on storage.objects for select using (
  bucket_id = 'documents' and (storage.foldername(name))[1] = auth_org()::text and
  ((storage.foldername(name))[2] = auth.uid()::text or is_admin() or is_my_report(((storage.foldername(name))[2])::uuid)));
create policy "docs insert" on storage.objects for insert with check (
  bucket_id = 'documents' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "identity insert own" on storage.objects for insert with check (
  bucket_id = 'identity' and (storage.foldername(name))[2] = my_employee_id()::text);
create policy "identity read admin or own" on storage.objects for select using (
  bucket_id = 'identity' and (is_admin() or (storage.foldername(name))[2] = my_employee_id()::text));
```

## 6. Seed data (also used by the mock repo)

- Org: "Demo Industries Pvt Ltd".
- Departments: Engineering, Sales, HR, Finance.
- Users: `admin@demo.test` (admin), `manager1@demo.test`, `manager2@demo.test` (managers), `emp1..emp6@demo.test` (employees; emp1-3 report to manager1, emp4-6 to manager2).
- Leave types: Casual (12, paid), Sick (10, paid), Earned (15, paid), Unpaid (0, unpaid).
- Holidays: 5 sample dates in current year.
- Salary structures: basic 30,000-90,000 INR (stored in paise), HRA 40% of basic, allowance "Transport" 1,600, deductions "Professional Tax" flat 200, "PF" 12% of basic (demo values).
- One published payroll run for the previous month, one draft contract, one pending leave, one pending verification, three analyzed documents (contract, invoice, notice) with risks and deadlines.

## 7. Type contract

Generate `lib/repo/types.ts` with one TypeScript interface per table (snake_case DB columns mapped to camelCase in the app via a single mapper). Add a `repo.contract.test.ts` that runs the same CRUD assertions against mock and (when env present) Supabase.

## 8. Migration checklist

- [ ] `0001_init.sql` runs on a clean Supabase project with zero errors.
- [ ] RLS enabled on all tables (query `pg_tables` + `pg_policies` to assert).
- [ ] Seed script creates auth users via admin API then inserts profiles.
- [ ] Buckets created and policies applied.
- [ ] `supabase gen types typescript` output reconciles with `types.ts`.
