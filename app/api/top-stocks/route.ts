import { NextResponse } from "next/server";
import { evaluateStock } from "@/lib/evaluator";
import { getCachedEvaluation, saveEvaluation } from "@/lib/supabase";

export const maxDuration = 60;

const STOCK_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META",
  "JPM", "V", "JNJ", "UNH", "HD", "XOM", "NFLX", "AMD",
  "CRM", "BA", "INTC", "PFE", "KO",
];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function GET() {
  const results: Array<{
    ticker: string;
    companyName: string;
    sector: string;
    price: number;
    change: number;
    changePercent: number;
    finalScore: number;
    rating: string;
    ratingColor: string;
    image: string;
  }> = [];

  const evaluations = await Promise.allSettled(
    STOCK_UNIVERSE.map(async (ticker) => {
      // Check cache first
      try {
        const cached = await withTimeout(getCachedEvaluation(ticker), 3000);
        if (cached?.metrics) {
          return cached.metrics;
        }
      } catch {
        // Cache miss
      }

      // Fresh evaluation
      const result = await evaluateStock(ticker);

      // Cache it (fire and forget)
      withTimeout(
        saveEvaluation({
          ticker: result.ticker,
          company_name: result.companyName,
          sector: result.sector,
          score: result.finalScore,
          rating: result.rating,
          metrics: result,
        }),
        3000
      ).catch(() => {});

      return result;
    })
  );

  for (const entry of evaluations) {
    if (entry.status === "fulfilled" && entry.value) {
      const r = entry.value;
      results.push({
        ticker: r.ticker,
        companyName: r.companyName,
        sector: r.sector,
        price: r.price,
        change: r.change,
        changePercent: r.changePercent,
        finalScore: r.finalScore,
        rating: r.rating,
        ratingColor: r.ratingColor,
        image: r.image,
      });
    }
  }

  const sorted = [...results].sort((a, b) => b.finalScore - a.finalScore);

  return NextResponse.json({
    topBuy: sorted.slice(0, 5),
    topSell: sorted.slice(-5).reverse(),
    all: sorted,
    updatedAt: new Date().toISOString(),
  });
}
