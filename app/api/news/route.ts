import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return NextResponse.json([], { status: 200 });
  }

  const endpoint = ticker
    ? `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker}&limit=15&apikey=${apiKey}`
    : `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${apiKey}`;

  try {
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) {
      console.error(`FMP news API error: ${res.status} ${res.statusText}`);
      return NextResponse.json([]);
    }
    const data = await res.json();
    // FMP might return error objects instead of arrays
    if (!Array.isArray(data)) {
      console.error("FMP news returned non-array:", data);
      return NextResponse.json([]);
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("News fetch failed:", err);
    return NextResponse.json([]);
  }
}
