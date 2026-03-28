// Server-only performance module — Supabase-backed, works on Vercel
import { supabase } from './supabase';
import type { PerformanceData, PerformanceEntry, TrackedStock } from './performance';

export async function readPerformanceData(): Promise<PerformanceData> {
  if (!supabase) return { trackedStocks: {}, lastUpdated: '' };

  try {
    // Fetch all tracked evaluations, ordered by date
    const { data: evals, error } = await supabase
      .from('performance_tracking')
      .select('*')
      .order('evaluated_at', { ascending: true });

    if (error || !evals) return { trackedStocks: {}, lastUpdated: '' };

    const trackedStocks: Record<string, TrackedStock> = {};

    for (const row of evals) {
      const ticker = row.ticker;
      if (!trackedStocks[ticker]) {
        trackedStocks[ticker] = {
          ticker,
          companyName: row.company_name || ticker,
          firstTracked: row.evaluated_at,
          entries: [],
          picks: [],
        };
      }

      const entry: PerformanceEntry = {
        date: row.evaluated_at,
        price: row.price,
        score: row.score,
        rating: row.rating,
      };

      trackedStocks[ticker].entries.push(entry);

      if (row.is_pick) {
        trackedStocks[ticker].picks.push({ ...entry });
      }
    }

    const lastUpdated = evals.length > 0
      ? evals[evals.length - 1].evaluated_at
      : new Date().toISOString();

    return { trackedStocks, lastUpdated };
  } catch {
    return { trackedStocks: {}, lastUpdated: '' };
  }
}

export async function trackEvaluation(result: {
  ticker: string;
  companyName: string;
  rating: string;
  overallScore: number;
  price: number;
  evaluatedAt: string;
}) {
  if (!supabase) return;

  try {
    const isPick = result.rating === 'STRONG BUY' || result.rating === 'BUY';

    // Check for duplicate pick within 7 days
    let isPickInsert = false;
    if (isPick) {
      const sevenDaysAgo = new Date(
        new Date(result.evaluatedAt).getTime() - 7 * 86400000
      ).toISOString();

      const { data: recentPicks } = await supabase
        .from('performance_tracking')
        .select('id')
        .eq('ticker', result.ticker)
        .eq('is_pick', true)
        .gte('evaluated_at', sevenDaysAgo)
        .limit(1);

      isPickInsert = !recentPicks || recentPicks.length === 0;
    }

    await supabase.from('performance_tracking').insert({
      ticker: result.ticker,
      company_name: result.companyName,
      rating: result.rating,
      score: result.overallScore,
      price: result.price,
      evaluated_at: result.evaluatedAt,
      is_pick: isPickInsert,
    });
  } catch {
    // Non-critical — don't break evaluation flow
  }
}
