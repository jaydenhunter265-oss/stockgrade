import fs from 'fs/promises';
import path from 'path';
import type { EvaluationResult } from './types';
import { getRatingFromScore } from './utils';

const DATA_PATH = path.join(process.cwd(), 'data/performance.json');

interface PerformanceEntry {
  date: string;
  score: number;
  rating: string;
  price: number;
  changePercent: number;
}

interface TrackedStock {
  entries: PerformanceEntry[];
  firstTracked: string;
  picks: Array<{
    date: string;
    rating: string;
    score: number;
    entryPrice: number;
    currentPrice?: number;
    pnl?: number;
    pnlPct?: number;
    daysHeld?: number;
  }>;
}

interface PerformanceData {
  version: 1;
  lastUpdated: string | null;
  trackedStocks: Record<string, TrackedStock>;
  summary: {
    totalPicks: number;
    strongBuys: number;
    buys: number;
    holds: number;
    sells: number;
    winRate: number;
    totalReturn: number;
    spyReturn: number;
    alpha: number;
  };
}

export async function loadPerformanceData(): Promise<PerformanceData> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(data) as PerformanceData;
  } catch {
    return {
      version: 1,
      lastUpdated: null,
      trackedStocks: {},
      summary: { totalPicks: 0, strongBuys: 0, buys: 0, holds: 0, sells: 0, winRate: 0, totalReturn: 0, spyReturn: 0, alpha: 0 }
    };
  }
}

export async function savePerformanceData(data: PerformanceData): Promise<void> {
  data.lastUpdated = new Date().toISOString();
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function trackEvaluation(result: EvaluationResult): Promise<void> {
  const data = await loadPerformanceData();
  const ticker = result.ticker.toUpperCase();
  const now = new Date().toISOString();
  const entry: PerformanceEntry = {
    date: now,
    score: result.overallScore,
    rating: result.rating,
    price: result.price,
    changePercent: result.changePercent
  };

  if (!data.trackedStocks[ticker]) {
    data.trackedStocks[ticker] = {
      entries: [],
      firstTracked: now,
      picks: []
    };
  }

  const stock = data.trackedStocks[ticker];
  stock.entries.push(entry);

  // Keep only last 100 entries per stock
  if (stock.entries.length > 100) {
    stock.entries = stock.entries.slice(-100);
  }

  // Auto-create pick for STRONG BUY or SELL ratings (top/bottom 20%)
  if (result.overallScore >= 75 || result.overallScore <= 25) {
    const existingPick = stock.picks.find(p => !p.currentPrice && p.date === now.split('T')[0]);
    if (!existingPick) {
      stock.picks.push({
        date: now.split('T')[0],
        rating: result.rating,
        score: result.overallScore,
        entryPrice: result.price
      });
    }
  }

  // Update summary
  data.summary.totalPicks = Object.values(data.trackedStocks).reduce((sum, s) => sum + s.picks.length, 0);

  await savePerformanceData(data);
}

export async function getPerformanceSummary(): Promise<{
  totalPicks: number;
  winRate: number;
  picks: Array<{
    ticker: string;
    rating: string;
    score: number;
    daysHeld: number;
    pnlPct: number;
  }>;
}> {
  const data = await loadPerformanceData();
  // Simplified summary - full calc would fetch current prices
  return {
    totalPicks: data.summary.totalPicks,
    winRate: data.summary.winRate,
    picks: Object.entries(data.trackedStocks)
      .flatMap(([ticker, stock]) => stock.picks.map(p => ({
        ticker,
        rating: p.rating,
        score: p.score,
        daysHeld: p.daysHeld ?? 0,
        pnlPct: p.pnlPct ?? 0
      })))
      .sort((a, b) => b.pnlPct - a.pnlPct)
      .slice(0, 10)
  };
}

export async function getStockHistory(ticker: string): Promise<PerformanceEntry[]> {
  const data = await loadPerformanceData();
  return data.trackedStocks[ticker.toUpperCase()]?.entries.slice(-30) ?? [];
}

