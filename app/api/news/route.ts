import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "FMP_API_KEY not configured" }, { status: 500 });
  }

  const endpoint = ticker
    ? `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker}&limit=15&apikey=${apiKey}`
    : `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${apiKey}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
