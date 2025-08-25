### Supabase setup

1) Create a Supabase project and set envs in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...
```

2) Run migrations and seed
- Using the Supabase SQL editor, run the SQL in `supabase/migrations/20250823120000_init.sql` then `supabase/seed/001_seed.sql`.

3) Auth and users
- The app creates/updates `public.users` via `/api/auth/setup`. Ensure RLS is enabled; policies are included in the migration.

4) Credits & Billing
- Credits accrue when an order’s `status` becomes `PAID`.
- Credits deduct when an interview’s `status` transitions to `COMPLETED`.

5) Roles
- `public.users.role`: defaults to `candidate`. Promote to `employer` or `admin` as needed.

6) Companies & Membership
- Employers create `companies`. Owner membership is auto-created by trigger.

7) Public data
- `jobs` and `credit_packages` are selectable publicly; everything else is protected by RLS.


