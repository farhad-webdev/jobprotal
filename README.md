# JobPulse CMS & AI Job Portal

A production-ready, full-featured Job Portal CMS and Job Seeker platform built with Vite, React, Tailwind CSS, and Supabase (Postgres + Auth + Storage).

## Tech Stack

- **Frontend**: Vite, React (TypeScript), Tailwind CSS, Lucide Icons
- **Backend / DB**: Supabase (Postgres Database, Row Level Security, Auth, Storage)
- **AI Agent**: Google GenAI SDK (@google/genai) for automated job curation & posting
- **Deployment**: Vercel / GitHub Pages ready

---

## Supabase Database Schema (Jobs Table)

To set up your Supabase Postgres database, execute the following SQL in your Supabase SQL Editor:

```sql
create type job_type as enum ('Full-time', 'Part-time', 'Contract', 'Remote', 'Internship');
create type job_status as enum ('draft', 'published', 'archived', 'expired', 'rejected');
create type posted_by_enum as enum ('admin', 'agent');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo text,
  website text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  company_id uuid references companies(id) on delete set null,
  company_name text not null,
  location text not null,
  job_type job_type not null default 'Full-time',
  category text not null,
  salary_min numeric,
  salary_max numeric,
  salary_currency text default 'BDT',
  salary_text text default 'Negotiable',
  description_summary text not null,
  responsibilities text[],
  requirements text[],
  benefits text[],
  vacancy integer,
  experience_required text,
  apply_url text not null,
  source_name text not null,
  source_url text not null,
  posted_date date not null default current_date,
  deadline date not null,
  status job_status not null default 'draft',
  posted_by posted_by_enum not null default 'admin',
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade,
  candidate_name text not null,
  candidate_email text not null,
  candidate_phone text not null,
  resume_text text not null,
  cover_letter text,
  applied_date timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'submitted',
  notes text
);
```

---

## Installation & Run

> Use **Bun** (recommended — `bun.lock` is committed). `npm install` may fail on an
> esbuild peer-dependency conflict; if you must use npm, run
> `npm install --legacy-peer-deps`.

1. Install dependencies:
```bash
bun install
```

2. Set up Supabase (required — the backend stores everything in Postgres):
   - Create a project at https://supabase.com
   - Open **SQL Editor** and run, in order:
     1. `supabase/migrations/001_initial_schema.sql`
     2. `supabase/migrations/002_add_missing_columns.sql`
     3. (optional demo data) `supabase/seed.sql`

3. Configure environment variables in `.env`:
```bash
cp .env.example .env
```
Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Dashboard > Project
Settings > API > `service_role` — server-only, never expose it),
`AGENT_API_KEY` (long random string), and `GEMINI_API_KEY`.

4. Run development server:
```bash
bun run dev
```

5. Build + start production:
```bash
bun run build && bun run start
# or with plain node (works after build): npm start
```

## Deploy (Node host — Railway / Render / Fly.io)

The app needs a long-running Node process (`server.cjs` serves both the API and
the built frontend). It does **not** work on static-only hosts (GitHub Pages)
or serverless-only hosts (Vercel) as-is.

1. Push this repo to your host, set the same env vars as in `.env.example`.
2. Build command: `bun install && bun run build` (or `npm install --legacy-peer-deps && npm run build`)
3. Start command: `bun run start` (or `npm start`)

## Agent API

The browser agent posts jobs with the `AGENT_API_KEY`:

```bash
curl -X POST https://YOUR-HOST/api/jobs \
  -H "Content-Type: application/json" \
  -H "x-api-key: $AGENT_API_KEY" \
  -d '{"title":"...","companyName":"...","location":"...","deadline":"2026-12-31",
       "applyUrl":"https://...","sourceUrl":"https://...","sourceName":"..."}'
```

- Valid posts are saved as `draft` for admin review (`/api/admin/jobs?status=draft`
  via the dashboard Review queue).
- Past deadlines are rejected (`EXPIRED_DEADLINE`); duplicate `source_url`
  values are rejected (`DUPLICATE_SOURCE_URL`); max 50 posts/hour per key.
