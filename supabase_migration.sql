-- Run this in Supabase SQL Editor
-- Adds pipeline_type and columns fields to the pipelines table

alter table public.pipelines
  add column if not exists pipeline_type text default 'shortform',
  add column if not exists columns jsonb default null;
