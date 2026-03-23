import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

// 15-minute cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ news: [] }, { status: 400 });

  const symbol = ticker.trim().toUpperCase();

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await (yahooFinance as any).search(symbol, {
      newsCount: 10,
      quotesCount: 0,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const news = (results.news ?? []).map((n: any) => ({
      title: n.title ?? "",
      publisher: n.publisher ?? "",
      link: n.link ?? "",
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : null,
      thumbnail:
        n.thumbnail?.resolutions?.find((r: { width: number }) => r.width >= 120)?.url ??
        n.thumbnail?.resolutions?.[0]?.url ??
        null,
    }));

    const result = { news };
    cache.set(symbol, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ news: [] });
  }
}
