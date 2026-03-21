import { NextRequest, NextResponse } from "next/server";

// In-memory cache: 24hr TTL to respect Alpha Vantage's 25 req/day free limit
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const AV_KEY = process.env.ALPHA_VANTAGE_KEY;

async function avFetch(func: string, symbol: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ function: func, symbol, apikey: AV_KEY!, ...extra });
  const res = await fetch(`https://www.alphavantage.co/query?${params}`, {
    next: { revalidate: 0 }, // never cache at edge
  });
  if (!res.ok) throw new Error(`Alpha Vantage ${func} HTTP ${res.status}`);
  const json = await res.json();
  // Rate-limited or invalid key response
  if (json["Note"] || json["Information"]) throw new Error("Alpha Vantage rate limit hit");
  return json;
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  if (!AV_KEY) return NextResponse.json({ error: "Alpha Vantage key not configured" }, { status: 500 });

  const symbol = ticker.trim().toUpperCase();

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // 2 API calls: RSI(14) daily + MACD daily
    const [rsiRaw, macdRaw] = await Promise.all([
      avFetch("RSI", symbol, { interval: "daily", time_period: "14", series_type: "close" }),
      avFetch("MACD", symbol, { interval: "daily", series_type: "close" }),
    ]);

    // RSI processing
    const rsiSeries: Record<string, { RSI: string }> = rsiRaw["Technical Analysis: RSI"] ?? {};
    const rsiDates = Object.keys(rsiSeries).sort().reverse();
    const latestRsi = rsiDates[0] ? parseFloat(rsiSeries[rsiDates[0]].RSI) : null;
    const rsiHistory = rsiDates
      .slice(0, 60)
      .reverse()
      .map((d) => ({ date: d, value: parseFloat(rsiSeries[d].RSI) }));

    // MACD processing
    const macdSeries: Record<string, { MACD: string; MACD_Signal: string; MACD_Hist: string }> =
      macdRaw["Technical Analysis: MACD"] ?? {};
    const macdDates = Object.keys(macdSeries).sort().reverse();
    const latestMacd =
      macdDates[0]
        ? {
            macd: parseFloat(macdSeries[macdDates[0]].MACD),
            signal: parseFloat(macdSeries[macdDates[0]].MACD_Signal),
            hist: parseFloat(macdSeries[macdDates[0]].MACD_Hist),
          }
        : null;
    const macdHistory = macdDates
      .slice(0, 60)
      .reverse()
      .map((d) => ({
        date: d,
        macd: parseFloat(macdSeries[d].MACD),
        signal: parseFloat(macdSeries[d].MACD_Signal),
        hist: parseFloat(macdSeries[d].MACD_Hist),
      }));

    // Interpret signals
    let rsiSignal: "overbought" | "oversold" | "neutral" = "neutral";
    if (latestRsi !== null) {
      if (latestRsi > 70) rsiSignal = "overbought";
      else if (latestRsi < 30) rsiSignal = "oversold";
    }

    let macdSignal: "bullish" | "bearish" | "neutral" = "neutral";
    if (latestMacd) {
      if (latestMacd.macd > latestMacd.signal && latestMacd.hist > 0) macdSignal = "bullish";
      else if (latestMacd.macd < latestMacd.signal && latestMacd.hist < 0) macdSignal = "bearish";
    }

    const result = {
      ticker: symbol,
      rsi: latestRsi,
      rsiSignal,
      rsiHistory,
      macd: latestMacd,
      macdSignal,
      macdHistory,
      updatedAt: new Date().toISOString(),
    };

    cache.set(symbol, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch technicals";
    return NextResponse.json({ error: msg, ticker: symbol }, { status: 500 });
  }
}
