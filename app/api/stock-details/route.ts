import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

// 2-hour in-memory cache — stock-details data changes infrequently
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 2 * 60 * 60 * 1000;

const FMP_KEY = process.env.FMP_API_KEY;

export const maxDuration = 15;

interface FMPPriceTargetConsensus {
  symbol?: string;
  targetHigh?: number;
  targetLow?: number;
  targetConsensus?: number; // mean/average
  targetMedian?: number;
}

/**
 * Fetch analyst price-target consensus from FMP.
 * FMP is more frequently updated than Yahoo Finance for this specific data.
 * Returns null on failure so callers can fall back to Yahoo.
 */
async function fetchFMPAnalystTargets(symbol: string): Promise<{
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
} | null> {
  if (!FMP_KEY) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v3/price-target-consensus/${symbol}?apikey=${FMP_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data: FMPPriceTargetConsensus[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const t = data[0];
    // Require at least a consensus target to consider this valid
    if (t.targetConsensus == null) return null;
    return {
      targetLow: t.targetLow ?? null,
      targetMean: t.targetConsensus ?? null,
      targetMedian: t.targetMedian ?? null,
      targetHigh: t.targetHigh ?? null,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  const symbol = ticker.trim().toUpperCase();

  // Serve from cache if fresh
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Run FMP price-target fetch and Yahoo quoteSummary in parallel
    const [fmpTargets, yahooResult] = await Promise.all([
      fetchFMPAnalystTargets(symbol),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (yahooFinance.quoteSummary(symbol, {
        modules: ["financialData", "esgScores", "recommendationTrend", "earningsTrend", "defaultKeyStatistics"] as any[],
      }) as Promise<unknown>).catch(() => null),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = yahooResult || {};
    const fin = result.financialData || {};
    const esg = result.esgScores || {};
    const recTrend = result.recommendationTrend || {};
    const earnTrend = result.earningsTrend || {};
    const keyStats = result.defaultKeyStatistics || {};

    // Analyst targets: FMP preferred (more accurate), Yahoo as fallback
    const analystTargets = {
      targetLow:    fmpTargets?.targetLow    ?? fin.targetLowPrice    ?? null,
      targetMean:   fmpTargets?.targetMean   ?? fin.targetMeanPrice   ?? null,
      targetMedian: fmpTargets?.targetMedian ?? fin.targetMedianPrice ?? null,
      targetHigh:   fmpTargets?.targetHigh   ?? fin.targetHighPrice   ?? null,
      // numberOfAnalysts and recommendation metadata always from Yahoo (not in FMP consensus endpoint)
      currentPrice:        fin.currentPrice               ?? null,
      numberOfAnalysts:    fin.numberOfAnalystOpinions    ?? null,
      recommendationKey:   fin.recommendationKey          ?? null,
      recommendationMean:  fin.recommendationMean         ?? null,
    };

    // Analyst recommendation distribution over last 4 months
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recommendationTrends = (recTrend.trend || []).slice(0, 4).map((p: any) => ({
      period: p.period,
      strongBuy: p.strongBuy ?? 0,
      buy: p.buy ?? 0,
      hold: p.hold ?? 0,
      sell: p.sell ?? 0,
      strongSell: p.strongSell ?? 0,
    }));

    // Earnings/revenue estimates per period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const earningsEstimates = (earnTrend.trend || []).slice(0, 4).map((p: any) => ({
      period: p.period,
      endDate: typeof p.endDate === "string" ? p.endDate : (p.endDate instanceof Date ? p.endDate.toISOString().split("T")[0] : null),
      growth: p.growth?.raw ?? p.growth ?? null,
      earningsEstimate: {
        avg: p.earningsEstimate?.avg?.raw ?? p.earningsEstimate?.avg ?? null,
        low: p.earningsEstimate?.low?.raw ?? p.earningsEstimate?.low ?? null,
        high: p.earningsEstimate?.high?.raw ?? p.earningsEstimate?.high ?? null,
        numberOfAnalysts: p.earningsEstimate?.numberOfAnalysts?.raw ?? p.earningsEstimate?.numberOfAnalysts ?? null,
        yearAgoEps: p.earningsEstimate?.yearAgoEps?.raw ?? p.earningsEstimate?.yearAgoEps ?? null,
      },
      revenueEstimate: {
        avg: p.revenueEstimate?.avg?.raw ?? p.revenueEstimate?.avg ?? null,
        low: p.revenueEstimate?.low?.raw ?? p.revenueEstimate?.low ?? null,
        high: p.revenueEstimate?.high?.raw ?? p.revenueEstimate?.high ?? null,
        numberOfAnalysts: p.revenueEstimate?.numberOfAnalysts?.raw ?? p.revenueEstimate?.numberOfAnalysts ?? null,
        yearAgoRevenue: p.revenueEstimate?.yearAgoRevenue?.raw ?? p.revenueEstimate?.yearAgoRevenue ?? null,
      },
    }));

    // Ownership & short interest
    const ownership = {
      heldByInsiders:            keyStats.heldPercentInsiders?.raw     ?? keyStats.heldPercentInsiders     ?? null,
      heldByInstitutions:        keyStats.heldPercentInstitutions?.raw  ?? keyStats.heldPercentInstitutions  ?? null,
      shortPercentOfFloat:       keyStats.shortPercentOfFloat?.raw      ?? keyStats.shortPercentOfFloat      ?? null,
      sharesShort:               keyStats.sharesShort?.raw              ?? keyStats.sharesShort              ?? null,
      shortRatio:                keyStats.shortRatio?.raw               ?? keyStats.shortRatio               ?? null,
      impliedSharesOutstanding:  keyStats.impliedSharesOutstanding?.raw ?? keyStats.impliedSharesOutstanding ?? null,
      floatShares:               keyStats.floatShares?.raw              ?? keyStats.floatShares              ?? null,
      priceToBook:               keyStats.priceToBook?.raw              ?? keyStats.priceToBook              ?? null,
    };

    const data = {
      analystTargets,
      esg: {
        totalEsg:           esg.totalEsg?.raw           ?? esg.totalEsg           ?? null,
        environmentScore:   esg.environmentScore?.raw   ?? esg.environmentScore   ?? null,
        socialScore:        esg.socialScore?.raw        ?? esg.socialScore        ?? null,
        governanceScore:    esg.governanceScore?.raw    ?? esg.governanceScore    ?? null,
        esgPerformance:     esg.esgPerformance          ?? null,
        peerGroup:          esg.peerGroup               ?? null,
        highestControversy: esg.highestControversy      ?? null,
        peerCount:          esg.peerCount               ?? null,
        percentile:         esg.percentile?.raw         ?? esg.percentile         ?? null,
      },
      recommendationTrends,
      earningsEstimates,
      ownership,
    };

    cache.set(symbol, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ analystTargets: null, esg: null, recommendationTrends: [], earningsEstimates: [], ownership: null });
  }
}
