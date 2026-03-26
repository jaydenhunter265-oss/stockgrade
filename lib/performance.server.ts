// Server-only performance module — uses fs, never import from client components
import fs from 'fs/promises';
import path from 'path';
import type { PerformanceData, PerformanceEntry, TrackedStock } from './performance';

const DATA_FILE = path.join(process.cwd(), 'data', 'performance.json');

export async function readPerformanceData(): Promise<PerformanceData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { trackedStocks: {}, lastUpdated: new Date().toISOString() };
  }
}

async function writePerformanceData(data: PerformanceData) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function trackEvaluation(result: {
  ticker: string;
  companyName: string;
  rating: string;
  overallScore: number;
  price: number;
  evaluatedAt: string;
}) {
  try {
    const data = await readPerformanceData();

    const entry: PerformanceEntry = {
      date: result.evaluatedAt,
      price: result.price,
      score: result.overallScore,
      rating: result.rating,
    };

    if (!data.trackedStocks[result.ticker]) {
      data.trackedStocks[result.ticker] = {
        ticker: result.ticker,
        companyName: result.companyName,
        firstTracked: result.evaluatedAt,
        entries: [],
        picks: [],
      } satisfies TrackedStock;
    }

    const stock = data.trackedStocks[result.ticker];
    stock.entries.push(entry);
    if (stock.entries.length > 90) stock.entries = stock.entries.slice(-90);

    if (result.rating === 'STRONG BUY' || result.rating === 'BUY') {
      const alreadyPicked = stock.picks.some(
        (p) =>
          Math.abs(
            new Date(p.date).getTime() - new Date(result.evaluatedAt).getTime()
          ) <
          7 * 86400000
      );
      if (!alreadyPicked) stock.picks.push({ ...entry });
    }

    data.lastUpdated = new Date().toISOString();
    await writePerformanceData(data);
  } catch {
    // Non-critical
  }
}
