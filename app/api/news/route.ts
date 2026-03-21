import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

const NEWSDATA_KEY = process.env.NEWSDATA_KEY;

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}

async function fetchNewsData(): Promise<NewsItem[]> {
  if (!NEWSDATA_KEY) throw new Error("No NewsData key");

  const params = new URLSearchParams({
    apikey: NEWSDATA_KEY,
    category: "business",
    country: "us",
    language: "en",
    size: "10",
  });

  const res = await fetch(`https://newsdata.io/api/1/latest?${params}`, {
    next: { revalidate: 300 }, // cache for 5 minutes
  });
  if (!res.ok) throw new Error(`NewsData HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("NewsData non-success response");

  return (json.results ?? []).slice(0, 10).map((item: {
    title?: string;
    source_name?: string;
    source_id?: string;
    link?: string;
    pubDate?: string;
    image_url?: string | null;
  }) => ({
    title: item.title ?? "",
    publisher: item.source_name ?? item.source_id ?? "Unknown",
    link: item.link ?? "",
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    thumbnail: item.image_url ?? null,
  }));
}

async function fetchYahooNews(): Promise<NewsItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await yahooFinance.search("stock market today", {
    newsCount: 12,
    quotesCount: 0,
  });

  return (result.news || []).slice(0, 10).map((item: {
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    thumbnail?: { resolutions?: Array<{ url?: string }> };
  }) => ({
    title: item.title ?? "",
    publisher: item.publisher ?? "",
    link: item.link ?? "",
    publishedAt: item.providerPublishTime
      ? new Date(item.providerPublishTime * 1000).toISOString()
      : new Date().toISOString(),
    thumbnail: item.thumbnail?.resolutions?.[0]?.url ?? null,
  }));
}

export async function GET() {
  // Try NewsData.io first (better coverage), fall back to Yahoo Finance
  try {
    const news = await fetchNewsData();
    if (news.length > 0) return NextResponse.json({ news, source: "newsdata" });
  } catch {
    // fall through to Yahoo Finance
  }

  try {
    const news = await fetchYahooNews();
    return NextResponse.json({ news, source: "yahoo" });
  } catch {
    return NextResponse.json({ news: [] });
  }
}
