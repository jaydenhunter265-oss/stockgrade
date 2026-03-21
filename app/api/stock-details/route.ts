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
      modules: ["financialData", "esgScores", "recommendationTrend", "earningsTrend", "defaultKeyStatistics"] as any[],
    });

    const fin = result.financialData || {};
    const esg = result.esgScores || {};
    const recTrend = result.recommendationTrend || {};
    const earnTrend = result.earningsTrend || {};
    const keyStats = result.defaultKeyStatistics || {};

    // Analyst recommendation distribution over last 4 months
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recommendationTrends = (recTrend.trend || []).slice(0, 4).map((p: any) => ({
      period: p.period, // "0m", "-1m", "-2m", "-3m"
      strongBuy: p.strongBuy ?? 0,
      buy: p.buy ?? 0,
      hold: p.hold ?? 0,
      sell: p.sell ?? 0,
      strongSell: p.strongSell ?? 0,
    }));

    // Earnings/revenue estimates per period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const earningsEstimates = (earnTrend.trend || []).slice(0, 4).map((p: any) => ({
      period: p.period, // "0q", "+1q", "0y", "+1y"
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
      heldByInsiders: keyStats.heldPercentInsiders?.raw ?? keyStats.heldPercentInsiders ?? null,
      heldByInstitutions: keyStats.heldPercentInstitutions?.raw ?? keyStats.heldPercentInstitutions ?? null,
      shortPercentOfFloat: keyStats.shortPercentOfFloat?.raw ?? keyStats.shortPercentOfFloat ?? null,
      sharesShort: keyStats.sharesShort?.raw ?? keyStats.sharesShort ?? null,
      shortRatio: keyStats.shortRatio?.raw ?? keyStats.shortRatio ?? null,
      impliedSharesOutstanding: keyStats.impliedSharesOutstanding?.raw ?? keyStats.impliedSharesOutstanding ?? null,
      floatShares: keyStats.floatShares?.raw ?? keyStats.floatShares ?? null,
      priceToBook: keyStats.priceToBook?.raw ?? keyStats.priceToBook ?? null,
    };

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
      recommendationTrends,
      earningsEstimates,
      ownership,
    });
  } catch {
    return NextResponse.json({ analystTargets: null, esg: null, recommendationTrends: [], earningsEstimates: [], ownership: null });
  }
}
