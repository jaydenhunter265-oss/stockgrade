import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.search("stock market today", {
      newsCount: 12,
      quotesCount: 0,
    });

    const news = (result.news || []).slice(0, 10).map((item: {
      title?: string;
      publisher?: string;
      link?: string;
      providerPublishTime?: number;
      thumbnail?: { resolutions?: Array<{ url?: string }> };
    }) => ({
      title: item.title || "",
      publisher: item.publisher || "",
      link: item.link || "",
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime * 1000).toISOString()
        : new Date().toISOString(),
      thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
    }));

    return NextResponse.json({ news });
  } catch {
    // If yahoo-finance2 search doesn't work, return empty gracefully
    return NextResponse.json({ news: [] });
  }
}
