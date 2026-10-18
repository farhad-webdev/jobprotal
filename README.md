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

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```
