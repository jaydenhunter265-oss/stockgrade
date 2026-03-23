import { NextRequest, NextResponse } from "next/server";

// 4-hour in-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 4 * 60 * 60 * 1000;

const FMP_KEY = process.env.FMP_API_KEY;

export const maxDuration = 15;

interface RawTrade {
  filingDate?: string;
  transactionDate?: string;
  reportingName?: string;
  typeOfOwner?: string;
  transactionType?: string;
  acquistionOrDisposition?: string;
  securitiesTransacted?: number;
  price?: number;
  securityName?: string;
  formType?: string;
  link?: string;
}

function formatRole(owner: string): string {
  if (!owner) return "Insider";
  const o = owner.toLowerCase();
  if (o.includes("chief executive") || o.includes("ceo")) return "CEO";
  if (o.includes("chief financial") || o.includes("cfo")) return "CFO";
  if (o.includes("chief operating") || o.includes("coo")) return "COO";
  if (o.includes("chief technology") || o.includes("cto")) return "CTO";
  if (o.includes("president")) return "President";
  if (o.includes("director")) return "Director";
  if (o.includes("officer")) return "Officer";
  if (o.includes("10%") || o.includes("percent")) return ">10% Owner";
  if (o.includes("vp") || o.includes("vice president")) return "VP";
  return "Insider";
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  if (!FMP_KEY) {
    return NextResponse.json({ trades: [], summary: null, error: "FMP key not configured" });
  }

  const symbol = ticker.trim().toUpperCase();

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const res = await fetch(
      `https://financialmodelingprep.com/api/v4/insider-trading?symbol=${symbol}&limit=25&apikey=${FMP_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) throw new Error(`FMP HTTP ${res.status}`);
    const raw: RawTrade[] = await res.json();

    if (!Array.isArray(raw)) {
      return NextResponse.json({ trades: [], summary: null });
    }

    // Normalize trades
    const trades = raw.map((t) => {
      const shares = t.securitiesTransacted ?? 0;
      const price = t.price ?? 0;
      const value = shares * price;
      const isBuy = t.acquistionOrDisposition === "A";
      return {
        filingDate: t.filingDate ?? null,
        transactionDate: t.transactionDate ?? null,
        reportingName: t.reportingName ?? "Unknown",
        role: formatRole(t.typeOfOwner ?? ""),
        typeOfOwner: t.typeOfOwner ?? "",
        transactionType: t.transactionType ?? "",
        isBuy,
        securitiesTransacted: shares,
        price: price > 0 ? price : null,
        value,
        securityName: t.securityName ?? "Common Stock",
        formType: t.formType ?? "4",
        link: t.link ?? null,
      };
    });

    // Filter out non-meaningful transactions (awards, tax withholding, etc.)
    const meaningful = trades.filter((t) => {
      const type = t.transactionType.toUpperCase();
      // Keep only real buys (P-Purchase) and sells (S-Sale, S-Sale+OE, etc.)
      // Exclude: A-Award, F-TaxWithholding, M-ExerciseOption, G-Gift, D-Return
      return type.startsWith("P-") || type.startsWith("S-") || t.isBuy && type.startsWith("A-") === false;
    });

    // Use all trades for display but meaningful for summary
    const buys = meaningful.filter((t) => t.isBuy);
    const sells = meaningful.filter((t) => !t.isBuy);
    const buyValue = buys.reduce((s, t) => s + t.value, 0);
    const sellValue = sells.reduce((s, t) => s + t.value, 0);
    const totalValue = buyValue + sellValue;
    const sentimentScore = totalValue > 0 ? Math.round((buyValue / totalValue) * 100) : 50;

    // Cluster detection: 3+ distinct insiders buying in last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recentBuyers = new Set(
      buys
        .filter((t) => t.transactionDate && new Date(t.transactionDate) >= cutoff)
        .map((t) => t.reportingName)
    );
    const clusterBuying = recentBuyers.size >= 3;

    const result = {
      trades: trades.slice(0, 15),
      summary: {
        buyCount: buys.length,
        sellCount: sells.length,
        buyValue,
        sellValue,
        sentimentScore,
        clusterBuying,
        recentBuyerCount: recentBuyers.size,
      },
    };

    cache.set(symbol, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ trades: [], summary: null, error: msg });
  }
}
