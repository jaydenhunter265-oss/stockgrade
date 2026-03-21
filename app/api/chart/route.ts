import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const range = request.nextUrl.searchParams.get("range") || "1M";

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  }

  const symbol = ticker.trim().toUpperCase();
  const now = new Date();
  let period1: Date;
  let interval: string;

  switch (range) {
    case "1D":
      period1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days to ensure data
      interval = "5m";
      break;
    case "5D":
      period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      interval = "15m";
      break;
    case "1M":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 1);
      interval = "1d";
      break;
    case "3M":
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 3);
      interval = "1d";
      break;
    case "1Y":
      period1 = new Date(now);
      period1.setFullYear(period1.getFullYear() - 1);
      interval = "1wk";
      break;
    case "5Y":
      period1 = new Date(now);
      period1.setFullYear(period1.getFullYear() - 5);
      interval = "1mo";
      break;
    default:
      period1 = new Date(now);
      period1.setMonth(period1.getMonth() - 1);
      interval = "1d";
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.chart(symbol, {
      period1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      interval: interval as any,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quotes = (result.quotes || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q.close != null && !isNaN(q.close))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((q: any) => ({
        date: q.date instanceof Date ? q.date.toISOString() : q.date,
        close: q.close,
        high: q.high,
        low: q.low,
        open: q.open,
        volume: q.volume,
      }));

    return NextResponse.json({
      quotes,
      meta: {
        symbol: result.meta?.symbol || symbol,
        currency: result.meta?.currency || "USD",
      },
    });
  } catch {
    return NextResponse.json({ quotes: [], meta: { symbol, currency: "USD" } });
  }
}
