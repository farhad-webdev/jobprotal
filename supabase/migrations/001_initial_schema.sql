-- JobPulse CMS Supabase Migration: 001_initial_schema.sql

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

-- ROW LEVEL SECURITY (RLS) POLICIES

alter table companies enable row level security;
alter table categories enable row level security;
alter table jobs enable row level security;
alter table applications enable row level security;

-- Public can read published jobs where deadline >= today
create policy "Public read published jobs" on jobs
  for select using (status = 'published' and deadline >= current_date);

-- Public can read companies and categories
create policy "Public read companies" on companies for select using (true);
create policy "Public read categories" on categories for select using (true);

-- Authenticated admins / editors have full access to jobs, companies, categories
create policy "Admin full access jobs" on jobs
  for all using (auth.role() = 'authenticated');

create policy "Admin full access companies" on companies
  for all using (auth.role() = 'authenticated');

create policy "Admin full access categories" on categories
  for all using (auth.role() = 'authenticated');

-- Public can submit applications
create policy "Public insert applications" on applications
  for insert with check (true);

create policy "Admin read applications" on applications
  for select using (auth.role() = 'authenticated');
