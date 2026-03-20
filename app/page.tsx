"use client";

import { useState, useRef } from "react";
import type { EvaluationResult, CategoryScore, MetricScore } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";
import WelcomePopup from "@/components/welcome-popup";
import ScoreGauge from "@/components/score-gauge";
import NewsSection from "@/components/news-section";

function SignalBadge({ signal }: { signal: "buy" | "neutral" | "sell" }) {
  const colors = {
    buy: { bg: "#166534", text: "#4ade80" },
    neutral: { bg: "#92400e", text: "#fbbf24" },
    sell: { bg: "#991b1b", text: "#f87171" },
  };
  const c = colors[signal];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold uppercase"
      style={{ background: c.bg, color: c.text }}
    >
      {signal}
    </span>
  );
}

function CategoryBar({ category }: { category: CategoryScore }) {
  const [expanded, setExpanded] = useState(false);
  const barColor =
    category.percentage >= 65 ? "#22c55e" : category.percentage >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="rounded-xl p-4 transition-colors cursor-pointer"
      style={{ background: "#141414", border: "1px solid #262626" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: "#e4e4e7" }}>
          {category.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: barColor }}>
            {category.percentage}
          </span>
          <span
            className="text-xs transition-transform"
            style={{ color: "#71717a", transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
          >
            &#9660;
          </span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#262626" }}>
        <div
          className="h-full rounded-full metric-bar"
          style={{ width: `${category.percentage}%`, background: barColor }}
        />
      </div>
      {/* Metrics detail */}
      {expanded && (
        <div className="mt-4 space-y-2">
          {category.metrics.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg text-sm"
              style={{ background: "#1a1a1a" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ color: "#d4d4d8" }}>{m.name}</span>
                  <SignalBadge signal={m.signal} />
                </div>
                <div className="text-xs mt-0.5" style={{ color: "#71717a" }}>
                  {m.formula}
                </div>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="font-mono text-sm font-semibold" style={{ color: "#fafafa" }}>
                  {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                </div>
                <div className="text-xs" style={{ color: "#71717a" }}>{m.sectorNote}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignalList({ title, metrics, color }: { title: string; metrics: MetricScore[]; color: string }) {
  if (metrics.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2" style={{ color }}>
        {title}
      </h3>
      <div className="space-y-1.5">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg text-sm"
            style={{ background: "#141414", border: "1px solid #262626" }}
          >
            <span style={{ color: "#d4d4d8" }}>{m.name}</span>
            <span className="font-mono" style={{ color }}>
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto mt-8 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="shimmer rounded-2xl h-64 w-full md:w-72 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="shimmer rounded-xl h-8 w-3/4" />
          <div className="shimmer rounded-xl h-6 w-1/2" />
          <div className="shimmer rounded-xl h-20 w-full" />
          <div className="shimmer rounded-xl h-20 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleEvaluate(e?: React.FormEvent) {
    e?.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/evaluate?ticker=${t}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Evaluation failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const popular = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "JPM"];

  return (
    <>
      <WelcomePopup />

      <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
        {/* Header */}
        <header
          className="sticky top-0 z-40 border-b"
          style={{ background: "#0a0a0aee", borderColor: "#262626", backdropFilter: "blur(12px)" }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
              >
                S
              </div>
              <span className="text-lg font-bold" style={{ color: "#fafafa" }}>
                StockGrade
              </span>
            </div>
            <span className="text-xs" style={{ color: "#71717a" }}>
              350+ Metrics Analysis
            </span>
          </div>
        </header>

        {/* Hero / Search */}
        <div className={cn("transition-all duration-500", !searched ? "pt-24 pb-12" : "pt-6 pb-4")}>
          <div className="max-w-2xl mx-auto px-4 text-center">
            {!searched && (
              <div className="mb-8 animate-fade-in">
                <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ color: "#fafafa" }}>
                  Evaluate Any Stock
                </h1>
                <p className="text-lg" style={{ color: "#a1a1aa" }}>
                  Get instant Buy/Sell ratings powered by 350+ quantitative metrics
                </p>
              </div>
            )}

            <form onSubmit={handleEvaluate} className="flex gap-2 max-w-xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter ticker symbol (e.g. NVDA)"
                className="flex-1 px-5 py-3 rounded-xl text-base font-mono outline-none transition-colors"
                style={{
                  background: "#141414",
                  border: "1px solid #333",
                  color: "#fafafa",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#333")}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
              >
                {loading ? (
                  <span className="pulse-glow">Analyzing...</span>
                ) : (
                  "Evaluate"
                )}
              </button>
            </form>

            {/* Popular tickers */}
            {!searched && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 animate-fade-in stagger-2">
                {popular.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTicker(t); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-colors"
                    style={{ background: "#1a1a1a", border: "1px solid #262626", color: "#a1a1aa" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#262626")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto px-4 mb-6">
            <div
              className="rounded-xl p-4 text-sm animate-fade-in"
              style={{ background: "#991b1b20", border: "1px solid #991b1b", color: "#f87171" }}
            >
              {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Results */}
        {result && !loading && (
          <div className="max-w-7xl mx-auto px-4 pb-16 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Company header + Score */}
                <div
                  className="rounded-2xl p-6"
                  style={{ background: "#141414", border: "1px solid #262626" }}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Score gauge */}
                    <ScoreGauge
                      score={result.finalScore}
                      rating={result.rating}
                      ratingColor={result.ratingColor}
                    />

                    {/* Company info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {result.image && (
                          <img
                            src={result.image}
                            alt=""
                            className="w-10 h-10 rounded-lg"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div>
                          <h2 className="text-2xl font-bold" style={{ color: "#fafafa" }}>
                            {result.ticker}
                          </h2>
                          <p className="text-sm" style={{ color: "#a1a1aa" }}>
                            {result.companyName}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="text-2xl font-bold font-mono" style={{ color: "#fafafa" }}>
                          ${result.price.toFixed(2)}
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: result.change >= 0 ? "#22c55e" : "#ef4444" }}
                        >
                          {result.change >= 0 ? "+" : ""}
                          {result.change.toFixed(2)} ({result.changePercent.toFixed(2)}%)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {result.sector && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs"
                            style={{ background: "#1e3a5f", color: "#60a5fa" }}
                          >
                            {result.sector}
                          </span>
                        )}
                        {result.industry && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs"
                            style={{ background: "#1a1a1a", color: "#a1a1aa", border: "1px solid #262626" }}
                          >
                            {result.industry}
                          </span>
                        )}
                        <span
                          className="px-2.5 py-1 rounded-lg text-xs"
                          style={{ background: "#1a1a1a", color: "#a1a1aa", border: "1px solid #262626" }}
                        >
                          MCap: {formatNumber(result.marketCap)}
                        </span>
                        {result.exchange && (
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs"
                            style={{ background: "#1a1a1a", color: "#71717a", border: "1px solid #262626" }}
                          >
                            {result.exchange}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top signals and red flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SignalList
                    title="&#9650; Top Buy Signals"
                    metrics={result.topSignals}
                    color="#22c55e"
                  />
                  <SignalList
                    title="&#9660; Red Flags"
                    metrics={result.redFlags}
                    color="#ef4444"
                  />
                </div>

                {/* Category breakdown */}
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "#fafafa" }}>
                    Metric Categories
                  </h2>
                  <div className="space-y-3">
                    {result.categories.map((cat, i) => (
                      <CategoryBar key={i} category={cat} />
                    ))}
                  </div>
                </div>

                {/* Scoring rubric */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: "#141414", border: "1px solid #262626" }}
                >
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#a1a1aa" }}>
                    Scoring Rubric
                  </h3>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { range: "75-100", label: "STRONG BUY", color: "#22c55e" },
                      { range: "55-74", label: "BUY", color: "#4ade80" },
                      { range: "35-54", label: "HOLD", color: "#f59e0b" },
                      { range: "15-34", label: "UNDERWEIGHT", color: "#f97316" },
                      { range: "0-14", label: "SELL", color: "#ef4444" },
                    ].map((r) => (
                      <div key={r.label} className="py-2 rounded-lg" style={{ background: "#1a1a1a" }}>
                        <div className="font-bold" style={{ color: r.color }}>{r.label}</div>
                        <div style={{ color: "#71717a" }}>{r.range}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-xs" style={{ color: "#52525b" }}>
                  This analysis is for informational and educational purposes only. It is not financial
                  advice. Past performance does not guarantee future results. Always conduct your own
                  due diligence and consult a licensed financial advisor.
                </p>
              </div>

              {/* Sidebar — News */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <NewsSection ticker={result.ticker} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Default news when no search */}
        {!searched && !loading && (
          <div className="max-w-3xl mx-auto px-4 pb-16 mt-8">
            <NewsSection />
          </div>
        )}
      </div>
    </>
  );
}
