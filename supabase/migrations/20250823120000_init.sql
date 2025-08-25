-- Supabase schema for AI Interviewer Job Portal
-- Generated to satisfy requirements in README.md

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Enums
do $$ begin
  create type public.user_role as enum ('candidate','employer','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.remote_type as enum ('REMOTE','HYBRID','ONSITE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_type as enum ('TECHNICAL','CODING','BEHAVIORAL','SITUATIONAL','MIXED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_status as enum ('DRAFT','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('APPLIED','ASSIGNED_INTERVIEW','SELECTED','NEXT_ROUND','OFFER_SENT','REJECTED','WITHDRAWN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.member_role as enum ('owner','admin','member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.question_source as enum ('MANUAL','JOB_DESCRIPTION','TEMPLATE','AI');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('DRAFT','OPEN','PAUSED','CLOSED');
exception when duplicate_object then null; end $$;

-- Helper functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users u
    where u.id = uid and u.role = 'admin'
  );
$$;

-- Base users profile table mirroring auth.users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  profile_image text,
  anonymous boolean default false,
  created_at timestamptz default now(),
  last_active_at timestamptz default now(),
  role public.user_role not null default 'candidate'
);

alter table public.users enable row level security;

create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can insert self profile"
  on public.users for insert
  with check (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "Admins can delete users"
  on public.users for delete
  using (public.is_admin(auth.uid()));

-- Companies and membership
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  size text,
  location text,
  website text,
  created_by uuid not null references public.users(id) on delete restrict,
  credits_balance integer not null default 0,
  plan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger companies_set_updated_at
before update on public.companies
for each row execute procedure public.set_updated_at();

alter table public.companies enable row level security;

-- create company members table
create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz default now(),
  unique (company_id, user_id)
);

create or replace function public.is_company_member(company_uuid uuid, uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.company_members m
    where m.company_id = company_uuid and m.user_id = uid
  );
$$;

create or replace function public.is_company_admin(company_uuid uuid, uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.company_members m
    where m.company_id = company_uuid and m.user_id = uid and m.role in ('owner','admin')
  );
$$;

-- auto owner membership on company create
create or replace function public.create_company_owner_membership()
returns trigger
language plpgsql
as $$
begin
  insert into public.company_members (company_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists companies_create_owner_membership on public.companies;
create trigger companies_create_owner_membership
after insert on public.companies
for each row execute procedure public.create_company_owner_membership();

alter table public.company_members enable row level security;

create policy "Members can view memberships"
  on public.company_members for select
  using (user_id = auth.uid() or public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Company admins manage memberships"
  on public.company_members for all
  using (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Members can view company"
  on public.companies for select
  using (public.is_company_member(id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Creator can insert company"
  on public.companies for insert
  with check (created_by = auth.uid() or public.is_admin(auth.uid()));

create policy "Company admins update/delete company"
  on public.companies for update
  using (public.is_company_admin(id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Company admins delete company"
  on public.companies for delete
  using (public.is_company_admin(id, auth.uid()) or public.is_admin(auth.uid()));

-- Job listings (publicly visible)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  tech_stack text[] not null default '{}',
  experience_min integer,
  experience_max integer,
  salary_min integer,
  salary_max integer,
  currency text not null default 'USD',
  location text,
  remote_type public.remote_type,
  status public.job_status not null default 'DRAFT',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute procedure public.set_updated_at();

alter table public.jobs enable row level security;

create policy "Jobs are public to view"
  on public.jobs for select
  using (true);

create policy "Company admins manage jobs"
  on public.jobs for all
  using (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()));

-- Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid references public.users(id) on delete set null,
  candidate_email text not null,
  resume_url text,
  cover_letter text,
  status public.application_status not null default 'APPLIED',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger applications_set_updated_at
before update on public.applications
for each row execute procedure public.set_updated_at();

alter table public.applications enable row level security;

create policy "Candidates or company members can view applications"
  on public.applications for select
  using (
    (candidate_id is not null and candidate_id = auth.uid())
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_company_member(j.company_id, auth.uid())
    )
    or public.is_admin(auth.uid())
  );

create policy "Candidates or company admins can create applications"
  on public.applications for insert
  with check (
    (candidate_id = auth.uid())
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_company_admin(j.company_id, auth.uid())
    )
    or public.is_admin(auth.uid())
  );

create policy "Candidates or company admins can update applications"
  on public.applications for update
  using (
    (candidate_id is not null and candidate_id = auth.uid())
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_company_admin(j.company_id, auth.uid())
    )
    or public.is_admin(auth.uid())
  );

-- Interviews
create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete restrict,
  job_id uuid references public.jobs(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  candidate_id uuid references public.users(id) on delete set null,
  candidate_email text not null,
  candidate_name text,
  interview_type public.interview_type not null,
  num_questions integer,
  skills text[] not null default '{}',
  depth text not null default 'MEDIUM',
  question_source public.question_source not null default 'AI',
  minutes_duration integer not null check (minutes_duration > 0),
  scheduled_at timestamptz,
  timezone text,
  status public.interview_status not null default 'DRAFT',
  invite_token text unique,
  invite_expires_at timestamptz,
  reschedule_allowed_count integer not null default 1,
  credits_estimated integer,
  credits_spent integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger interviews_set_updated_at
before update on public.interviews
for each row execute procedure public.set_updated_at();

-- Default estimated credits equals minutes_duration
create or replace function public.set_interview_estimated_credits()
returns trigger
language plpgsql
as $$
begin
  if new.credits_estimated is null then
    new.credits_estimated := new.minutes_duration;
  end if;
  return new;
end;
$$;

drop trigger if exists interviews_set_estimated_credits on public.interviews;
create trigger interviews_set_estimated_credits
before insert on public.interviews
for each row execute procedure public.set_interview_estimated_credits();

alter table public.interviews enable row level security;

create policy "Members and candidate can view interview"
  on public.interviews for select
  using (
    public.is_company_member(company_id, auth.uid())
    or (candidate_id is not null and candidate_id = auth.uid())
    or public.is_admin(auth.uid())
  );

create policy "Company admins create/update/delete interviews"
  on public.interviews for all
  using (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()));

-- Interview sessions
create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  status text,
  reschedule_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (reschedule_count <= 1)
);

create trigger interview_sessions_set_updated_at
before update on public.interview_sessions
for each row execute procedure public.set_updated_at();

alter table public.interview_sessions enable row level security;

create policy "Members and candidate can view sessions"
  on public.interview_sessions for select
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id
        and (
          public.is_company_member(i.company_id, auth.uid())
          or (i.candidate_id is not null and i.candidate_id = auth.uid())
          or public.is_admin(auth.uid())
        )
    )
  );

create policy "Company admins manage sessions"
  on public.interview_sessions for insert
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id
        and (public.is_company_admin(i.company_id, auth.uid()) or public.is_admin(auth.uid()))
    )
  );

create policy "Candidate can reschedule within limit"
  on public.interview_sessions for update
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.candidate_id = auth.uid()
    )
    or exists (
      select 1 from public.interviews i
      where i.id = interview_id and (public.is_company_admin(i.company_id, auth.uid()) or public.is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and i.candidate_id = auth.uid()
    )
    or exists (
      select 1 from public.interviews i
      where i.id = interview_id and (public.is_company_admin(i.company_id, auth.uid()) or public.is_admin(auth.uid()))
    )
  );

-- Interview results (hidden from candidates)
create table if not exists public.interview_results (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  overall_score integer,
  scores jsonb,
  transcript_url text,
  transcript text,
  video_url text,
  flagged_cheating boolean default false,
  flags jsonb,
  notes text,
  created_at timestamptz default now()
);

alter table public.interview_results enable row level security;

create policy "Only company members and admins can view results"
  on public.interview_results for select
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and (public.is_company_member(i.company_id, auth.uid()) or public.is_admin(auth.uid()))
    )
  );

create policy "Only company admins and admins manage results"
  on public.interview_results for all
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and (public.is_company_admin(i.company_id, auth.uid()) or public.is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_id and (public.is_company_admin(i.company_id, auth.uid()) or public.is_admin(auth.uid()))
    )
  );

-- Question templates library
create table if not exists public.question_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  job_role text,
  content jsonb not null,
  is_public boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger question_templates_set_updated_at
before update on public.question_templates
for each row execute procedure public.set_updated_at();

alter table public.question_templates enable row level security;

create policy "Public or owner or admin can view templates"
  on public.question_templates for select
  using (is_public or created_by = auth.uid() or public.is_admin(auth.uid()));

create policy "Owner or admin can modify templates"
  on public.question_templates for all
  using (created_by = auth.uid() or public.is_admin(auth.uid()))
  with check (created_by = auth.uid() or public.is_admin(auth.uid()));

-- Billing
-- Reuse existing enum orderstatus from types if present; otherwise create minimal
do $$ begin
  perform 1 from pg_type where typname = 'orderstatus';
  if not found then
    create type public.orderstatus as enum ('UNPAID','PAID','SHIPPED','OUT','CANCELLED','PENDING');
  end if;
end $$;

create table if not exists public.credit_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null check (credits > 0),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.credit_packages enable row level security;

create policy "Packages are public to view"
  on public.credit_packages for select
  using (true);

create policy "Admins manage packages"
  on public.credit_packages for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  package_id uuid references public.credit_packages(id) on delete set null,
  credits integer not null,
  amount_cents integer not null,
  currency text not null default 'USD',
  status public.orderstatus not null default 'PENDING',
  payment_provider text,
  provider_ref text,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Company members view orders"
  on public.orders for select
  using (public.is_company_member(company_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Company admins create/update orders"
  on public.orders for all
  using (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()))
  with check (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()));

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  delta_credits integer not null,
  reason text not null,
  related_type text,
  related_id uuid,
  balance_after integer,
  created_at timestamptz default now()
);

alter table public.credit_transactions enable row level security;

create policy "Company members view credit transactions"
  on public.credit_transactions for select
  using (public.is_company_member(company_id, auth.uid()) or public.is_admin(auth.uid()));

create policy "Company admins create transactions"
  on public.credit_transactions for insert
  with check (public.is_company_admin(company_id, auth.uid()) or public.is_admin(auth.uid()));

-- Helper to apply credit delta and keep balance in sync
create or replace function public.apply_company_credit_delta(p_company_id uuid, p_delta integer, p_reason text, p_related_type text, p_related_id uuid)
returns void
language plpgsql
as $$
declare
  new_balance integer;
begin
  update public.companies
  set credits_balance = credits_balance + p_delta,
      updated_at = now()
  where id = p_company_id
  returning credits_balance into new_balance;

  insert into public.credit_transactions (company_id, delta_credits, reason, related_type, related_id, balance_after)
  values (p_company_id, p_delta, p_reason, p_related_type, p_related_id, new_balance);
end;
$$;

-- When an order becomes PAID, credit the company once
create or replace function public.handle_paid_order()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'UPDATE') then
    if (new.status = 'PAID' and (old.status is distinct from 'PAID')) then
      perform public.apply_company_credit_delta(new.company_id, new.credits, 'order_paid', 'order', new.id);
    end if;
  elsif (TG_OP = 'INSERT') then
    if (new.status = 'PAID') then
      perform public.apply_company_credit_delta(new.company_id, new.credits, 'order_paid', 'order', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_handle_paid on public.orders;
create trigger orders_handle_paid
after insert or update of status on public.orders
for each row execute procedure public.handle_paid_order();

-- Deduct credits when interview is completed
create or replace function public.handle_interview_completed()
returns trigger
language plpgsql
as $$
declare
  cost integer;
begin
  if (TG_OP = 'UPDATE') then
    if (new.status = 'COMPLETED' and (old.status is distinct from 'COMPLETED')) then
      cost := coalesce(new.credits_spent, new.credits_estimated, new.minutes_duration);
      perform public.apply_company_credit_delta(new.company_id, -cost, 'interview_completed', 'interview', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists interviews_handle_completed on public.interviews;
create trigger interviews_handle_completed
after update of status on public.interviews
for each row execute procedure public.handle_interview_completed();

-- Recommended realtime settings (optional)
alter table public.users replica identity full;
alter table public.applications replica identity full;
alter table public.interviews replica identity full;
alter table public.interview_sessions replica identity full;
alter table public.interview_results replica identity full;
alter table public.jobs replica identity full;
alter table public.companies replica identity full;
alter table public.company_members replica identity full;
alter table public.orders replica identity full;
alter table public.credit_transactions replica identity full;


