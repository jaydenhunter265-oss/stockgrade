import { NextRequest, NextResponse } from "next/server";
import { evaluateStock } from "@/lib/evaluator";
import { getCachedEvaluation, saveEvaluation, logSearch } from "@/lib/supabase";

// Allow up to 30s for Yahoo Finance API calls
export const maxDuration = 30;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker parameter" }, { status: 400 });
  }

  const symbol = ticker.trim().toUpperCase();

  // Log the search (fire and forget, 3s timeout)
  withTimeout(logSearch(symbol), 3000).catch(() => {});

  // Check Supabase cache first (1hr TTL, 5s timeout)
  try {
    const cached = await withTimeout(getCachedEvaluation(symbol), 5000);
    if (cached?.metrics) {
      return NextResponse.json(cached.metrics);
    }
  } catch {
    // Cache miss or error, proceed with fresh evaluation
  }

  try {
    const result = await evaluateStock(symbol);

    // Save to Supabase cache (fire and forget, 5s timeout)
    withTimeout(
      saveEvaluation({
        ticker: result.ticker,
        company_name: result.companyName,
        sector: result.sector,
        score: result.combinedScore,
        rating: result.rating,
        metrics: result,
      }),
      5000
    ).catch(() => {});

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
