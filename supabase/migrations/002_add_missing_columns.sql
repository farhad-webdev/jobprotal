-- JobPulse CMS Supabase Migration: 002_add_missing_columns.sql
-- Run AFTER 001_initial_schema.sql
-- Adds columns the API expects (company logo, view/applicant counters).

alter table jobs add column if not exists company_logo text;
alter table jobs add column if not exists views_count integer not null default 0;
alter table jobs add column if not exists applicants_count integer not null default 0;
