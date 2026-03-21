import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  const symbol = ticker.trim().toUpperCase();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quoteSummary(symbol, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modules: ["financialData", "esgScores"] as any[],
    });

    const fin = result.financialData || {};
    const esg = result.esgScores || {};

    return NextResponse.json({
      analystTargets: {
        targetLow: fin.targetLowPrice ?? null,
        targetMean: fin.targetMeanPrice ?? null,
        targetMedian: fin.targetMedianPrice ?? null,
        targetHigh: fin.targetHighPrice ?? null,
        currentPrice: fin.currentPrice ?? null,
        numberOfAnalysts: fin.numberOfAnalystOpinions ?? null,
        recommendationKey: fin.recommendationKey ?? null,
        recommendationMean: fin.recommendationMean ?? null,
      },
      esg: {
        totalEsg: esg.totalEsg?.raw ?? esg.totalEsg ?? null,
        environmentScore: esg.environmentScore?.raw ?? esg.environmentScore ?? null,
        socialScore: esg.socialScore?.raw ?? esg.socialScore ?? null,
        governanceScore: esg.governanceScore?.raw ?? esg.governanceScore ?? null,
        esgPerformance: esg.esgPerformance ?? null,
        peerGroup: esg.peerGroup ?? null,
        highestControversy: esg.highestControversy ?? null,
        peerCount: esg.peerCount ?? null,
        percentile: esg.percentile?.raw ?? esg.percentile ?? null,
      },
    });
  } catch {
    return NextResponse.json({ analystTargets: null, esg: null });
  }
}
