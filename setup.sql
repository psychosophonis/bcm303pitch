-- BCM303 Pitch Platform — Supabase setup
-- Run this in the Supabase SQL editor

-- Pitches table
create table if not exists pitches (
  id uuid default gen_random_uuid() primary key,
  group_name text not null unique,
  password_hash text not null,
  stocktake text,
  show_vision text,
  segment_anchor text,
  design_position text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Metapitch table (always single row, id=1)
create table if not exists metapitch (
  id int primary key default 1,
  content text default '',
  updated_at timestamptz default now()
);

insert into metapitch (id, content) values (1, '')
  on conflict (id) do nothing;

-- Row Level Security
alter table pitches enable row level security;
alter table metapitch enable row level security;

-- Public read on both tables (anon key is sufficient for reads)
create policy "pitches_public_read" on pitches
  for select using (true);

create policy "metapitch_public_read" on metapitch
  for select using (true);

-- No direct writes from client — all writes go through Edge Functions
-- using the service role key, which bypasses RLS
