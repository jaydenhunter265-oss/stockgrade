import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

// 6-hour cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  const symbol = ticker.trim().toUpperCase();

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quoteSummary(symbol, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modules: ["institutionOwnership", "majorHoldersBreakdown"] as any[],
    });

    const breakdown = result.majorHoldersBreakdown ?? {};
    const ownership = result.institutionOwnership ?? {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const holders = (ownership.ownershipList ?? []).map((h: any) => ({
      organization: h.organization ?? "Unknown",
      pctHeld: h.pctHeld?.raw ?? h.pctHeld ?? null,
      position: h.position?.raw ?? h.position ?? null,
      value: h.value?.raw ?? h.value ?? null,
      pctChange: h.pctChange?.raw ?? h.pctChange ?? null,
      reportDate:
        h.reportDate instanceof Date
          ? h.reportDate.toISOString().split("T")[0]
          : (h.reportDate ?? null),
    }));

    const data = {
      summary: {
        pctHeldByInsiders:
          breakdown.insidersPercentHeld?.raw ?? breakdown.insidersPercentHeld ?? null,
        pctHeldByInstitutions:
          breakdown.institutionsPercentHeld?.raw ?? breakdown.institutionsPercentHeld ?? null,
        pctHeldByFloatInstitutions:
          breakdown.institutionsFloatPercentHeld?.raw ??
          breakdown.institutionsFloatPercentHeld ?? null,
        institutionCount:
          breakdown.institutionsCount?.raw ?? breakdown.institutionsCount ?? null,
      },
      holders: holders.slice(0, 15),
    };

    cache.set(symbol, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ summary: null, holders: [] });
  }
}
