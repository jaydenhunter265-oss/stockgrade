import { NextRequest, NextResponse } from "next/server";

// Module-level CIK lookup cache — survives across requests in the same lambda instance
let tickerCIKMap: Record<string, number> | null = null;
let tickerCIKFetchedAt = 0;
const CIK_MAP_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Per-ticker filings cache
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

export const maxDuration = 20;

const EDGAR_HEADERS = {
  "User-Agent": "StockGrade research@stockgrade.com",
  Accept: "application/json",
};

async function getCIK(ticker: string): Promise<number | null> {
  const now = Date.now();

  // Refresh the ticker→CIK map if stale or missing
  if (!tickerCIKMap || now - tickerCIKFetchedAt > CIK_MAP_TTL) {
    try {
      const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": "StockGrade research@stockgrade.com" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`EDGAR tickers HTTP ${res.status}`);
      const raw = await res.json() as Record<string, { cik_str: number; ticker: string; title: string }>;
      tickerCIKMap = {};
      for (const entry of Object.values(raw)) {
        tickerCIKMap[entry.ticker.toUpperCase()] = entry.cik_str;
      }
      tickerCIKFetchedAt = now;
    } catch {
      return null;
    }
  }

  return tickerCIKMap![ticker] ?? null;
}

const RELEVANT_FORMS = new Set(["10-K", "10-K/A", "10-Q", "10-Q/A", "8-K", "8-K/A"]);

const FORM_LABELS: Record<string, string> = {
  "10-K": "Annual Report",
  "10-K/A": "Annual Report (Amended)",
  "10-Q": "Quarterly Report",
  "10-Q/A": "Quarterly Report (Amended)",
  "8-K": "Current Report",
  "8-K/A": "Current Report (Amended)",
};

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

  const symbol = ticker.trim().toUpperCase();

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Step 1: resolve CIK
    const cikInt = await getCIK(symbol);
    if (!cikInt) {
      return NextResponse.json({ filings: [], error: "Company not found in EDGAR" });
    }
    const cikPadded = String(cikInt).padStart(10, "0");

    // Step 2: fetch submissions from EDGAR
    const subsRes = await fetch(
      `https://data.sec.gov/submissions/CIK${cikPadded}.json`,
      { headers: EDGAR_HEADERS, signal: AbortSignal.timeout(10000) }
    );
    if (!subsRes.ok) throw new Error(`EDGAR submissions HTTP ${subsRes.status}`);

    const subs = await subsRes.json() as {
      name: string;
      filings: {
        recent: {
          form: string[];
          filingDate: string[];
          accessionNumber: string[];
          primaryDocument: string[];
          reportDate: string[];
        };
      };
    };

    const { form, filingDate, accessionNumber, reportDate } = subs.filings.recent;

    const filings = form
      .map((f, i) => {
        if (!RELEVANT_FORMS.has(f)) return null;
        const accNo = accessionNumber[i];
        const accNoClean = accNo.replace(/-/g, "");
        // Direct link to the filing index on EDGAR
        const indexUrl = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accNoClean}/${accNo}-index.htm`;
        // EDGAR viewer link for the filing
        const viewerUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikPadded}&type=${encodeURIComponent(f)}&dateb=&owner=include&count=5`;
        return {
          type: f,
          label: FORM_LABELS[f] ?? f,
          filingDate: filingDate[i] ?? null,
          reportDate: reportDate[i] ?? null,
          accessionNumber: accNo,
          url: indexUrl,
          viewerUrl,
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    const result = {
      filings,
      companyName: subs.name ?? symbol,
      cik: cikInt,
      edgarUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cikPadded}&type=&dateb=&owner=include&count=20`,
    };

    cache.set(symbol, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ filings: [], error: msg });
  }
}
