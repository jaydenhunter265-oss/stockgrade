import Link from "next/link";

export const metadata = {
  title: "Methodology - StockGrade",
  description: "How StockGrade calculates scores using 350+ quantitative metrics across fundamentals, technicals, sentiment, and risk.",
};

const categories = [
  {
    name: "Valuation",
    weight: "Part of Fundamentals (0–40)",
    color: "#10b981",
    metrics: ["P/E Ratio", "PEG Ratio", "P/B Ratio", "P/S Ratio", "P/FCF Ratio", "P/CF Ratio", "EV/EBITDA", "EV/Revenue", "EV/FCF", "Earnings Yield", "FCF Yield", "Graham Number"],
    description: "Measures how expensive a stock is relative to its earnings, cash flow, book value, and revenue. Sector-aware thresholds are applied — tech companies naturally trade at higher multiples than utilities.",
  },
  {
    name: "Profitability",
    weight: "Part of Fundamentals (0–40)",
    color: "#10b981",
    metrics: ["Gross Margin", "Operating Margin", "Net Profit Margin", "EBITDA Margin", "ROE", "ROA", "ROIC", "ROCE"],
    description: "Evaluates how efficiently a company converts revenue into profit and how well it uses investor capital. High ROIC (>12%) indicates the company creates value above its cost of capital.",
  },
  {
    name: "Liquidity & Solvency",
    weight: "Part of Fundamentals & Risk",
    color: "#f59e0b",
    metrics: ["Current Ratio", "Quick Ratio", "Cash Ratio", "Debt/Equity", "Debt/Assets", "Net Debt/EBITDA", "Interest Coverage", "Cash per Share"],
    description: "Assesses the company's ability to meet short-term obligations and manage long-term debt. A current ratio above 1.5 and debt/equity below 0.5 are strong indicators.",
  },
  {
    name: "Growth",
    weight: "Part of Fundamentals (0–40)",
    color: "#3b82f6",
    metrics: ["Revenue Growth YoY", "EPS Growth YoY", "Revenue 3yr CAGR", "Revenue 5yr CAGR", "Earnings Growth QoQ", "Net Income Growth", "FCF Growth YoY", "Book Value Growth"],
    description: "Tracks growth across revenue, earnings, and free cash flow. Multi-year CAGRs smooth out one-time events. FCF growth is considered the most important metric.",
  },
  {
    name: "Cash Flow",
    weight: "Part of Fundamentals (0–40)",
    color: "#10b981",
    metrics: ["Operating Cash Flow", "Free Cash Flow", "FCF per Share", "CapEx / Revenue", "FCF Conversion", "Accruals Ratio"],
    description: "Cash flow is the lifeblood of a company. FCF conversion above 90% indicates high earnings quality. The accruals ratio detects aggressive accounting.",
  },
  {
    name: "Momentum",
    weight: "Technical Score (0–30)",
    color: "#3b82f6",
    metrics: ["Price vs 50D SMA", "Price vs 200D SMA", "vs 52-Week High", "52-Week Range Position", "Volume Ratio", "Avg Daily Volume"],
    description: "Technical momentum indicators. Price above both SMAs is bullish. RSI and MACD are computed separately via Alpha Vantage for additional technical context.",
  },
  {
    name: "Risk & Volatility",
    weight: "Risk Score (0–10)",
    color: "#ef4444",
    metrics: ["Beta (1-Year)", "Market Cap"],
    description: "Measures systematic risk. Beta between 0.5-1.2 is moderate. Market cap above $2B provides stability. Combined with debt metrics for the full Risk pillar score.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group" style={{ textDecoration: "none" }}>
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              S
            </div>
            <span className="text-[13px] font-semibold tracking-tight" style={{ color: "var(--text-muted)" }}>
              StockGrade
            </span>
          </Link>
          <div className="ml-auto">
            <Link
              href="/"
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black mb-3" style={{ color: "var(--text)", letterSpacing: "-0.03em" }}>
            Methodology
          </h1>
          <p className="text-sm leading-relaxed max-w-lg" style={{ color: "var(--text-muted)" }}>
            How StockGrade evaluates stocks using 350+ quantitative metrics across fundamentals,
            technicals, sentiment, and risk.
          </p>
        </div>

        {/* 4-Pillar Overview */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text)" }}>The 4-Pillar Scoring System</h2>
          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            Every stock receives a score out of 100, composed of four pillars. Each pillar aggregates
            multiple metric categories and normalizes them to a weighted scale.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { name: "Fundamentals", max: 40, color: "#10b981", desc: "Valuation, profitability, growth, cash flow, balance sheet, dividends" },
              { name: "Technical", max: 30, color: "#3b82f6", desc: "Momentum, SMA trends, volume, 52-week position, RSI, MACD" },
              { name: "Sentiment", max: 20, color: "#a78bfa", desc: "Buy/sell signal ratio, earnings trends, margin direction" },
              { name: "Risk", max: 10, color: "#f59e0b", desc: "Beta, leverage, market cap, debt coverage, liquidity" },
            ].map((p) => (
              <div key={p.name} className="rounded-xl p-4" style={{ background: p.color + "08", border: `1px solid ${p.color}18` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: p.color }}>{p.name}</span>
                  <span className="text-sm font-black font-mono" style={{ color: p.color }}>0–{p.max}</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-bold mb-2" style={{ color: "var(--text)" }}>Overall Score = Fundamentals + Technical + Sentiment + Risk</div>
            <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              The combined score (0-100) directly determines the stock&apos;s rating:
              <strong className="mx-1" style={{ color: "#22c55e" }}>STRONG BUY (75+)</strong> /
              <strong className="mx-1" style={{ color: "#4ade80" }}>BUY (55-74)</strong> /
              <strong className="mx-1" style={{ color: "#f59e0b" }}>HOLD (35-54)</strong> /
              <strong className="mx-1" style={{ color: "#f97316" }}>UNDERWEIGHT (15-34)</strong> /
              <strong className="mx-1" style={{ color: "#ef4444" }}>SELL (&lt;15)</strong>
            </p>
          </div>
        </section>

        {/* How Scoring Works */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text)" }}>How Individual Metrics Are Scored</h2>
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Each of the 350+ metrics receives a signal: <strong style={{ color: "#10b981" }}>Buy (+1)</strong>,{" "}
                <strong style={{ color: "#f59e0b" }}>Neutral (0)</strong>, or{" "}
                <strong style={{ color: "#ef4444" }}>Sell (-1)</strong>.
              </p>
              <p className="text-[13px] leading-relaxed mt-2" style={{ color: "var(--text-secondary)" }}>
                Buy/sell thresholds are <strong>sector-aware</strong> — a P/E of 30 is acceptable for high-growth tech
                but would flag as overvalued for a utility company. Each category&apos;s score is computed as:
              </p>
              <div className="mt-3 px-4 py-3 rounded-lg font-mono text-[12px]" style={{ background: "rgba(0,191,165,0.06)", color: "var(--accent)" }}>
                Category % = ((sum of metric scores + count) / (2 x count)) x 100
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text)" }}>Data Sources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: "Yahoo Finance", desc: "Primary source for fundamentals, financials, price data, analyst targets, ESG ratings, earnings, and insider activity.", color: "var(--accent)" },
              { name: "Alpha Vantage", desc: "Technical indicators including RSI (14-period) and MACD (12, 26, 9) for momentum analysis.", color: "#3b82f6" },
              { name: "SEC EDGAR", desc: "10-K, 10-Q, and 8-K filings for compliance pattern analysis and restatement detection.", color: "#a78bfa" },
              { name: "Clearbit", desc: "Company logos for visual identification in the interface.", color: "#f59e0b" },
            ].map((src) => (
              <div key={src.name} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-sm font-bold mb-1.5" style={{ color: src.color }}>{src.name}</div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{src.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Category Details */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-5" style={{ color: "var(--text)" }}>Metric Categories</h2>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.name} className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold" style={{ color: cat.color }}>{cat.name}</h3>
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>{cat.weight}</span>
                </div>
                <p className="text-[12px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{cat.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cat.metrics.map((m) => (
                    <span key={m} className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: cat.color + "0a", color: cat.color, border: `1px solid ${cat.color}18` }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="rounded-xl p-5" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: "#ef4444" }}>Disclaimer</h2>
          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            StockGrade is for informational and educational purposes only. Scores and ratings are generated
            algorithmically from publicly available data and do not constitute financial advice. Always conduct
            your own due diligence and consult a qualified financial advisor before making investment decisions.
            Past performance does not guarantee future results.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>&copy; {new Date().getFullYear()} StockGrade</span>
            <Link href="/" className="text-[11px]" style={{ color: "var(--accent)" }}>Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
