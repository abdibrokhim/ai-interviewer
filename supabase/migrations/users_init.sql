-- Enum for app roles
do $$ begin
  create type public.user_role as enum ('candidate','employer','admin');
exception when duplicate_object then null; end $$;

-- Users profile table mirroring auth.users
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

-- Helpful index
create index if not exists users_email_idx on public.users (email);

-- RLS
alter table public.users enable row level security;

-- Helper to check admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql stable as $$
  select exists (
    select 1 from public.users u
    where u.id = uid and u.role = 'admin'
  );
$$;

-- Policies
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