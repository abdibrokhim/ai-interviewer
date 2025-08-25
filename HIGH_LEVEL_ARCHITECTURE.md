### High-level architecture

- **Frontend (Next.js App Router)**: UI for candidate, employer, admin; server actions for secure mutations; per-role layouts and guard components.
- **Auth & Data (Supabase)**: Auth (Google OAuth + email), Postgres with RLS, Realtime, Storage (resumes, transcripts, videos), Edge Functions + cron.
- **AI services**
  - **Interview agent**: LLM for dialog + rubric-driven scoring; integrates with voice and sentiment; leverages `gemini-live` flow you have.
  - **Resume parser**: LLM or external parser to extract name, email, skills, experience.
  - **Question generator**: LLM + templates + job description ingestion.
  - **Coding evaluation**: sandboxed code runner service (e.g., Piston/Judge0) for test execution.
- **Video/Voice**: LiveKit/Twilio/Agora for WebRTC sessions (recommend LiveKit for dev velocity).
- **Billing**: Stripe (credits packages, invoices, webhooks to update `orders` → credits applied).
- **Email**: Resend/SendGrid for invites, notifications, and transactional emails.
- **Observability**: Sentry (errors), PostHog (product analytics), structured logs.

### Core domains to build

- **Users & Roles**: `users` with `role`; profile setup via `/api/auth/setup`.
- **Companies & Membership**: `companies`, `company_members`; owner auto-membership; credits balance.
- **Jobs**: Employer CRUD; public browse; candidate applications; AI search.
- **Applications**: Candidate apply; employer pipeline (applied → interview assigned → next round → offer).
- **Interviews**: Authoring (type, skills, depth, questions/templates/JD), scheduling, credits estimate, invites, reschedule once.
- **Interview Runtime**: Live room, AI interviewer, code editor + tests, transcript, scoring, cheating detection.
- **Results**: Scores, transcript, artifacts; visible to employer/admin only.
- **Billing**: Packages, checkout, Stripe webhook, credit ledger and triggers (done).
- **Admin**: Users, jobs, orders, credit packages, question templates, interview logs, analytics.

### Storage buckets and access

- **resumes**: private; only candidate and company members tied to application via signed URLs.
- **interview-artifacts**: transcripts, JSON scoring; private to company members/admin.
- **interview-videos**: recordings; private; lifecycle policy (e.g., 90 days retention).

### Security and compliance

- **RLS-first**: All reads/writes enforced by policies (done for core tables).
- **Server actions**: Only for operations requiring secrets or cross-table business rules.
- **Least privilege**: Signed URLs for storage; never expose service role to client.
- **Rate limiting**: For public endpoints (auth, invites) via middleware or edge function guard.
- **Audit trails**: Insert events into a `logs` table for admin review.

### Phased implementation plan

- **Phase 1: Auth & Profile**
  - Google OAuth + email sign-in.
  - `/api/auth/setup` flow finalization; user context wired (already mostly done).
  - Basic role elevation tool for admin.

- **Phase 2: Employer org + Jobs**
  - Company create/join, membership management.
  - Job CRUD; public job listing page; RLS-backed queries.

- **Phase 3: Applications & Resume parsing**
  - Apply flow with resume upload to `resumes`.
  - Resume parser edge function updates candidate profile + application metadata.
  - Employer application views and filters.

- **Phase 4: Interview authoring & scheduling**
  - Interview create wizard (type, skills, depth, templates/JD upload).
  - Credits estimate pre-check.
  - Email invite with secure token; candidate acceptance flow; single reschedule.

- **Phase 5: Interview room (MVP)**
  - LiveKit integration; camera/mic checks; tab-switch detection; multi-face detection flagging.
  - AI interviewer loop (prompting, follow-up depth); code editor with test execution; timer.
  - Session/cheat events streaming to backend.

- **Phase 6: Scoring & reporting**
  - Aggregate scores (communication, technical, problem-solving, confidence), transcript, summary.
  - Employer result view; shortlist/reject/next-round actions.
  - Ensure candidate cannot view results.

- **Phase 7: Billing & credits**
  - Credits packages page; Stripe checkout; webhook → update `orders` to PAID → credits applied (DB trigger already added).
  - Deduct credits on interview completion (DB trigger already added).
  - Invoices and history UI.

- **Phase 8: Admin console**
  - Manage users, companies, jobs, orders, credit packages.
  - Question templates library management.
  - Interview logs and error dashboards.
  - Usage and revenue analytics.

- **Phase 9: Notifications & comms**
  - Email templates: invite, reschedule, low credits, admin alerts.
  - Digest emails for employers (interview outcomes, weekly usage).

- **Phase 10: Analytics, QA, hardening**
  - PostHog events; conversion funnels; cohort analysis.
  - E2E tests (Playwright) for critical flows; load testing for interview room.
  - Sentry alerts; CSP and secure headers; PII scrubbing in logs.

### API and integration notes

- **Server actions/APIs**: Keep thin; rely on RLS for authZ checks; consolidate mutations (e.g., create interview + estimate).
- **Stripe**: One webhook endpoint to transition `orders` status; idempotency keys.
- **Realtime**: Subscribe to `users`, `applications`, `interviews` for in-app live updates.
- **Search**: Start with Postgres full-text for candidate search; consider vector search later.

### Environments and configuration

- **.env**: Supabase, Stripe, email, LiveKit, LLM keys.
- **Edge Functions**: resume-parse, question-gen, email-dispatch, stripe-webhook.
- **Cron**: Expire invites, clean old recordings, send reminders.

### Risks and mitigations

- **Live code execution**: Use isolated sandbox; strict resource/time limits.
- **Cheating detection**: Best-effort; maintain flags and reviewer notes; be transparent in employer UI.
- **LLM drift**: Keep prompts versioned; log model/temperature; allow admin overrides.
- **Cost control**: Cache LLM outputs (templates/questions), set quotas per company.

If you want, I can turn this into an annotated architecture diagram and a concrete milestone backlog next.