import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ totalPicks: 0, trackedStocks: 0, winRate: 0, topPick: null });
  }

  try {
    // Count distinct tracked tickers
    const { data: stocks } = await supabase
      .from('performance_tracking')
      .select('ticker')
      .limit(500);

    const uniqueTickers = new Set(stocks?.map((s) => s.ticker) ?? []);

    // Get picks
    const { data: picks } = await supabase
      .from('performance_tracking')
      .select('ticker, score, price, rating, evaluated_at')
      .eq('is_pick', true)
      .order('evaluated_at', { ascending: false })
      .limit(100);

    // For each pick, get the latest price for that ticker to compute P&L
    const pickResults = [];
    if (picks && picks.length > 0) {
      const pickTickers = [...new Set(picks.map((p) => p.ticker))];

      // Get latest entry per ticker
      const latestPrices: Record<string, number> = {};
      for (const t of pickTickers) {
        const { data: latest } = await supabase
          .from('performance_tracking')
          .select('price')
          .eq('ticker', t)
          .order('evaluated_at', { ascending: false })
          .limit(1);
        if (latest?.[0]) latestPrices[t] = latest[0].price;
      }

      for (const p of picks) {
        const currentPrice = latestPrices[p.ticker];
        const pnlPct = currentPrice && p.price > 0
          ? ((currentPrice - p.price) / p.price) * 100
          : undefined;
        pickResults.push({
          ticker: p.ticker,
          rating: p.rating,
          score: p.score,
          pnlPct,
        });
      }
    }

    const withPnl = pickResults.filter((p) => p.pnlPct !== undefined);
    const wins = withPnl.filter((p) => (p.pnlPct ?? 0) > 0).length;
    const winRate = withPnl.length > 0 ? wins / withPnl.length : 0;
    const topPick = pickResults.sort((a, b) => (b.pnlPct ?? -Infinity) - (a.pnlPct ?? -Infinity))[0] ?? null;

    return NextResponse.json({
      totalPicks: picks?.length ?? 0,
      trackedStocks: uniqueTickers.size,
      winRate: Math.round(winRate * 100),
      topPick,
    });
  } catch {
    return NextResponse.json({ totalPicks: 0, trackedStocks: 0, winRate: 0, topPick: null });
  }
}
