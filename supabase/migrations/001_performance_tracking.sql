-- Performance tracking table for stock evaluations
-- Replaces the local data/performance.json file so data persists on Vercel

create table if not exists performance_tracking (
  id bigint generated always as identity primary key,
  ticker text not null,
  company_name text not null default '',
  rating text not null,
  score numeric not null,
  price numeric not null,
  evaluated_at timestamptz not null default now(),
  is_pick boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for fast lookups by ticker
create index if not exists idx_perf_ticker on performance_tracking (ticker);

-- Index for ordering by date
create index if not exists idx_perf_evaluated_at on performance_tracking (evaluated_at desc);

-- Index for picks queries
create index if not exists idx_perf_picks on performance_tracking (ticker, is_pick) where is_pick = true;

-- Enable RLS (row level security) — allow public read/insert via anon key
alter table performance_tracking enable row level security;

create policy "Allow public read" on performance_tracking
  for select using (true);

create policy "Allow public insert" on performance_tracking
  for insert with check (true);
