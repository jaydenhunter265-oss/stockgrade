// Client-safe performance module — fetch-based, no Node.js builtins

export interface PerformanceEntry {
  date: string;
  price: number;
  score: number;
  rating: string;
}

export interface PickEntry {
  date: string;
  price: number;
  score: number;
  rating: string;
}

export interface TrackedStock {
  ticker: string;
  companyName: string;
  firstTracked: string;
  entries: PerformanceEntry[];
  picks: PickEntry[];
}

export interface PerformanceData {
  trackedStocks: Record<string, TrackedStock>;
  lastUpdated: string;
}

export async function loadPerformanceData(): Promise<PerformanceData> {
  try {
    const res = await fetch('/api/performance');
    if (!res.ok) return { trackedStocks: {}, lastUpdated: '' };
    return res.json();
  } catch {
    return { trackedStocks: {}, lastUpdated: '' };
  }
}

export async function getStockHistory(ticker: string): Promise<PerformanceEntry[]> {
  const data = await loadPerformanceData();
  return data.trackedStocks[ticker]?.entries ?? [];
}

export async function getPerformanceSummary(): Promise<{
  totalPicks: number;
  winRate: number;
  picks: Array<{
    ticker: string;
    rating: string;
    score: number;
    entryPrice: number;
    pnlPct?: number;
    daysHeld?: number;
  }>;
}> {
  const data = await loadPerformanceData();
  const allPicks = Object.entries(data.trackedStocks).flatMap(([ticker, stock]) =>
    stock.picks.map((p) => {
      const latestEntry = stock.entries[stock.entries.length - 1];
      const pnlPct =
        latestEntry && p.price > 0
          ? ((latestEntry.price - p.price) / p.price) * 100
          : undefined;
      const daysHeld = latestEntry
        ? Math.round(
            (new Date(latestEntry.date).getTime() - new Date(p.date).getTime()) / 86400000
          )
        : undefined;
      return { ticker, rating: p.rating, score: p.score, entryPrice: p.price, pnlPct, daysHeld };
    })
  );

  const withPnl = allPicks.filter((p) => p.pnlPct !== undefined);
  const wins = withPnl.filter((p) => (p.pnlPct ?? 0) > 0).length;
  const winRate = withPnl.length > 0 ? wins / withPnl.length : 0;

  return {
    totalPicks: allPicks.length,
    winRate,
    picks: allPicks.sort((a, b) => (b.pnlPct ?? -Infinity) - (a.pnlPct ?? -Infinity)),
  };
}
