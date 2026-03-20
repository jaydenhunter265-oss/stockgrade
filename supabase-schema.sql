-- Run this in your Supabase SQL Editor to set up the database tables

-- Evaluations cache table
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  company_name TEXT,
  sector TEXT,
  score NUMERIC,
  rating TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search history table
CREATE TABLE IF NOT EXISTS searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_ticker ON evaluations(ticker);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_ticker ON searches(ticker);
CREATE INDEX IF NOT EXISTS idx_searches_searched_at ON searches(searched_at DESC);

-- Row Level Security (allow anonymous reads/writes for this public app)
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert evaluations" ON evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous read searches" ON searches FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert searches" ON searches FOR INSERT WITH CHECK (true);
