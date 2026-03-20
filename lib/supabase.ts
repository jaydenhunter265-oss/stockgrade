import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function saveEvaluation(evaluation: {
  ticker: string;
  company_name: string;
  sector: string;
  score: number;
  rating: string;
  metrics: object;
}) {
  const { error } = await supabase.from("evaluations").insert(evaluation);
  if (error) console.error("Supabase insert error:", error);
}

export async function getCachedEvaluation(ticker: string) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("ticker", ticker.toUpperCase())
    .gte("created_at", oneHourAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data;
}

export async function logSearch(ticker: string) {
  await supabase.from("searches").insert({ ticker: ticker.toUpperCase() });
}

export async function getPopularSearches() {
  const { data } = await supabase
    .from("searches")
    .select("ticker")
    .order("searched_at", { ascending: false })
    .limit(100);

  if (!data) return [];

  const counts: Record<string, number> = {};
  data.forEach((s) => {
    counts[s.ticker] = (counts[s.ticker] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ticker, count]) => ({ ticker, count }));
}
