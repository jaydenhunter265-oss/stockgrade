import { NextRequest, NextResponse } from "next/server";
import { evaluateStock } from "@/lib/evaluator";
import { getCachedEvaluation, saveEvaluation, logSearch } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker parameter" }, { status: 400 });
  }

  const symbol = ticker.trim().toUpperCase();
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "FMP_API_KEY not configured" }, { status: 500 });
  }

  // Log the search
  logSearch(symbol).catch(() => {});

  // Check Supabase cache first (1hr TTL)
  try {
    const cached = await getCachedEvaluation(symbol);
    if (cached?.metrics) {
      return NextResponse.json(cached.metrics);
    }
  } catch {
    // Cache miss or error, proceed with fresh evaluation
  }

  try {
    const result = await evaluateStock(symbol, apiKey);

    // Save to Supabase cache (fire and forget)
    saveEvaluation({
      ticker: result.ticker,
      company_name: result.companyName,
      sector: result.sector,
      score: result.finalScore,
      rating: result.rating,
      metrics: result,
    }).catch(() => {});

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
