import Link from "next/link";

export const metadata = {
  title: "Methodology — StockGrade",
  description: "How StockGrade calculates scores using 350+ quantitative metrics across fundamentals, technicals, sentiment, and risk.",
};

const pillars = [
  { name: "Fundamentals", max: 40, color: "#00D99E", desc: "Valuation, profitability, growth, cash flow, balance sheet, dividends" },
  { name: "Technical",    max: 30, color: "#388BFD", desc: "Momentum, SMA trends, volume, 52-week position, RSI, MACD" },
  { name: "Sentiment",   max: 20, color: "#A78BFA", desc: "Buy/sell signal ratio, earnings trends, margin direction" },
  { name: "Risk",        max: 10, color: "#FFB800", desc: "Beta, leverage, market cap, debt coverage, liquidity" },
];

const dataSources = [
  { name: "Yahoo Finance",   color: "var(--accent)", desc: "Primary source for fundamentals, financials, price data, analyst targets, ESG ratings, earnings, and insider activity." },
  { name: "Alpha Vantage",   color: "#388BFD",       desc: "Technical indicators including RSI (14-period) and MACD (12, 26, 9) for momentum analysis." },
  { name: "SEC EDGAR",       color: "#A78BFA",       desc: "10-K, 10-Q, and 8-K filings for compliance pattern analysis and restatement detection." },
  { name: "Clearbit",        color: "#FFB800",       desc: "Company logos for visual identification in the interface." },
];

const categories = [
  {
    name: "Valuation",
    weight: "Fundamentals (0–40)",
    color: "#00D99E",
    metrics: ["P/E Ratio", "PEG Ratio", "P/B Ratio", "P/S Ratio", "P/FCF Ratio", "P/CF Ratio", "EV/EBITDA", "EV/Revenue", "EV/FCF", "Earnings Yield", "FCF Yield", "Graham Number"],
    description: "Measures how expensive a stock is relative to its earnings, cash flow, book value, and revenue. Sector-aware thresholds are applied — tech companies naturally trade at higher multiples than utilities.",
  },
  {
    name: "Profitability",
    weight: "Fundamentals (0–40)",
    color: "#00D99E",
    metrics: ["Gross Margin", "Operating Margin", "Net Profit Margin", "EBITDA Margin", "ROE", "ROA", "ROIC", "ROCE"],
    description: "Evaluates how efficiently a company converts revenue into profit and how well it uses investor capital. High ROIC (>12%) indicates the company creates value above its cost of capital.",
  },
  {
    name: "Liquidity & Solvency",
    weight: "Fundamentals & Risk",
    color: "#FFB800",
    metrics: ["Current Ratio", "Quick Ratio", "Cash Ratio", "Debt/Equity", "Debt/Assets", "Net Debt/EBITDA", "Interest Coverage", "Cash per Share"],
    description: "Assesses the company's ability to meet short-term obligations and manage long-term debt. A current ratio above 1.5 and debt/equity below 0.5 are strong indicators.",
  },
  {
    name: "Growth",
    weight: "Fundamentals (0–40)",
    color: "#388BFD",
    metrics: ["Revenue Growth YoY", "EPS Growth YoY", "Revenue 3yr CAGR", "Revenue 5yr CAGR", "Earnings Growth QoQ", "Net Income Growth", "FCF Growth YoY", "Book Value Growth"],
    description: "Tracks growth across revenue, earnings, and free cash flow. Multi-year CAGRs smooth out one-time events. FCF growth is considered the most important metric.",
  },
  {
    name: "Cash Flow",
    weight: "Fundamentals (0–40)",
    color: "#00D99E",
    metrics: ["Operating Cash Flow", "Free Cash Flow", "FCF per Share", "CapEx / Revenue", "FCF Conversion", "Accruals Ratio"],
    description: "Cash flow is the lifeblood of a company. FCF conversion above 90% indicates high earnings quality. The accruals ratio detects aggressive accounting.",
  },
  {
    name: "Momentum",
    weight: "Technical Score (0–30)",
    color: "#388BFD",
    metrics: ["Price vs 50D SMA", "Price vs 200D SMA", "vs 52-Week High", "52-Week Range Position", "Volume Ratio", "Avg Daily Volume"],
    description: "Technical momentum indicators. Price above both SMAs is bullish. RSI and MACD are computed separately via Alpha Vantage for additional technical context.",
  },
  {
    name: "Risk & Volatility",
    weight: "Risk Score (0–10)",
    color: "#FF3B5C",
    metrics: ["Beta (1-Year)", "Market Cap"],
    description: "Measures systematic risk. Beta between 0.5–1.2 is moderate. Market cap above $2B provides stability. Combined with debt metrics for the full Risk pillar score.",
  },
];

const ratings = [
  { label: "STRONG BUY", range: "75–100", color: "#00D99E" },
  { label: "BUY",        range: "55–74",  color: "#00BFA5" },
  { label: "HOLD",       range: "35–54",  color: "#FFB800" },
  { label: "UNDERWEIGHT",range: "15–34",  color: "#FF8C00" },
  { label: "SELL",       range: "0–14",   color: "#FF3B5C" },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 header-glass">
        <div className="page-container h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group" style={{ textDecoration: "none" }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              S
            </div>
            <span
              className="text-[14px] font-semibold tracking-tight hidden sm:block"
              style={{ color: "var(--text-muted)", letterSpacing: "-0.01em" }}
            >
              StockGrade
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 ml-2">
            <div className="w-px h-4" style={{ background: "var(--border-hover)" }} />
            <span className="text-[13px] font-semibold" style={{ color: "var(--text-secondary)" }}>Methodology</span>
          </div>

          <div className="ml-auto">
            <Link href="/" className="btn-ghost btn-sm flex items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Back to Analyze
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ Content ═══ */}
      <main className="flex-1 page-container py-12 sm:py-16">

        {/* Page header */}
        <div className="mb-12">
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight mb-3"
            style={{ color: "var(--text)", letterSpacing: "-0.04em" }}
          >
            Scoring <span className="gradient-text">Methodology</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl" style={{ color: "var(--text-muted)" }}>
            How StockGrade evaluates stocks using 350+ quantitative metrics across
            fundamentals, technicals, sentiment, and risk.
          </p>
        </div>

        {/* ═══ 4-Pillar System ═══ */}
        <section className="mb-14">
          <h2 className="text-[17px] font-bold mb-2" style={{ color: "var(--text)" }}>
            The 4-Pillar Scoring System
          </h2>
          <p className="text-[13px] leading-relaxed mb-6 max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Every stock receives a score out of 100, composed of four pillars. Each pillar aggregates
            multiple metric categories and normalizes them to a weighted scale.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {pillars.map((p) => (
              <div
                key={p.name}
                className="rounded-xl p-5"
                style={{ background: p.color + "08", border: `1px solid ${p.color}18` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black"
                      style={{ background: p.color + "15", color: p.color }}
                    >
                      {p.name[0]}
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: p.color }}>{p.name}</span>
                  </div>
                  <span
                    className="text-[13px] font-black font-mono px-2.5 py-1 rounded-lg"
                    style={{ background: p.color + "12", color: p.color }}
                  >
                    0–{p.max}pts
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Formula */}
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-[13px] font-bold mb-2.5" style={{ color: "var(--text)" }}>
              Overall Score = Fundamentals + Technical + Sentiment + Risk
            </div>
            <div className="flex flex-wrap gap-2">
              {ratings.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: r.color + "0d", border: `1px solid ${r.color}22` }}
                >
                  <span className="text-[11px] font-bold" style={{ color: r.color }}>{r.label}</span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--text-dim)" }}>{r.range}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ How scoring works ═══ */}
        <section className="mb-14">
          <h2 className="text-[17px] font-bold mb-5" style={{ color: "var(--text)" }}>
            How Individual Metrics Are Scored
          </h2>
          <div className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
              Each of the 350+ metrics receives a signal:{" "}
              <strong style={{ color: "#00D99E" }}>Buy (+1)</strong>,{" "}
              <strong style={{ color: "#FFB800" }}>Neutral (0)</strong>, or{" "}
              <strong style={{ color: "#FF3B5C" }}>Sell (−1)</strong>.
            </p>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              Buy/sell thresholds are <strong style={{ color: "var(--text)" }}>sector-aware</strong> — a P/E of 30 is
              acceptable for high-growth tech but would flag as overvalued for a utility company.
              Each category&apos;s score is computed as:
            </p>
            <div
              className="px-5 py-3.5 rounded-xl font-mono text-[13px]"
              style={{ background: "rgba(0,191,165,0.07)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
            >
              Category % = ((sum of metric scores + count) / (2 × count)) × 100
            </div>
          </div>
        </section>

        {/* ═══ Data Sources ═══ */}
        <section className="mb-14">
          <h2 className="text-[17px] font-bold mb-5" style={{ color: "var(--text)" }}>Data Sources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dataSources.map((src) => (
              <div
                key={src.name}
                className="rounded-xl p-5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div
                  className="flex items-center gap-2 mb-2.5"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black"
                    style={{ background: src.color + "12", color: src.color }}
                  >
                    {src.name[0]}
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: src.color }}>{src.name}</div>
                </div>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{src.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Metric Categories ═══ */}
        <section className="mb-14">
          <h2 className="text-[17px] font-bold mb-5" style={{ color: "var(--text)" }}>Metric Categories</h2>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="rounded-xl p-5"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between mb-2 gap-4">
                  <h3 className="text-[14px] font-bold" style={{ color: cat.color }}>{cat.name}</h3>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                    style={{ background: cat.color + "0a", color: cat.color, border: `1px solid ${cat.color}18` }}
                  >
                    {cat.weight}
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed mb-3.5" style={{ color: "var(--text-secondary)" }}>
                  {cat.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.metrics.map((m) => (
                    <span
                      key={m}
                      className="text-[11px] font-mono px-2.5 py-1 rounded"
                      style={{ background: cat.color + "09", color: cat.color, border: `1px solid ${cat.color}16` }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Disclaimer ═══ */}
        <section
          className="rounded-xl p-6"
          style={{ background: "rgba(255,59,92,0.04)", border: "1px solid rgba(255,59,92,0.12)" }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
              style={{ background: "rgba(255,59,92,0.10)", color: "#FF3B5C" }}
            >
              !
            </div>
            <h2 className="text-[13px] font-bold" style={{ color: "#FF3B5C" }}>Disclaimer</h2>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            StockGrade is for informational and educational purposes only. Scores and ratings are generated
            algorithmically from publicly available data and do not constitute financial advice. Always conduct
            your own due diligence and consult a qualified financial advisor before making investment decisions.
            Past performance does not guarantee future results.
          </p>
        </section>
      </main>

      {/* ═══ Footer ═══ */}
      <footer style={{ borderTop: "1px solid var(--border)", marginTop: "48px" }}>
        <div className="page-container py-5">
          <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--text-dim)" }}>
            <span>© {new Date().getFullYear()} StockGrade</span>
            <div className="flex items-center gap-4">
              <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Analyze</Link>
              <Link href="/performance" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Performance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
