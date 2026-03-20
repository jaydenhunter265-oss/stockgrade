"use client";

import { useState, useRef } from "react";
import type { EvaluationResult, CategoryScore, MetricScore } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";
import WelcomePopup from "@/components/welcome-popup";
import ScoreGauge from "@/components/score-gauge";
import NewsSection from "@/components/news-section";

function SignalBadge({ signal }: { signal: "buy" | "neutral" | "sell" }) {
  const cls = signal === "buy" ? "signal-buy" : signal === "sell" ? "signal-sell" : "signal-neutral";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {signal}
    </span>
  );
}

function CategoryBar({ category, index }: { category: CategoryScore; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const barColor =
    category.percentage >= 65 ? "#30d158" : category.percentage >= 40 ? "#ffd60a" : "#ff453a";
  const barBg =
    category.percentage >= 65 ? "rgba(48,209,88,0.08)" : category.percentage >= 40 ? "rgba(255,214,10,0.06)" : "rgba(255,69,58,0.08)";

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-5 cursor-pointer animate-fade-in",
        `stagger-${Math.min(index + 1, 6)}`
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: barBg, color: barColor }}
          >
            {category.percentage}
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "#e5e5e7" }}>
            {category.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "#636366" }}>
            {category.metrics.filter(m => m.score === 1).length} buy · {category.metrics.filter(m => m.score === -1).length} sell
          </span>
          <span
            className="text-[10px] transition-transform duration-300"
            style={{
              color: "#636366",
              transform: expanded ? "rotate(180deg)" : "rotate(0)",
              display: "inline-block",
            }}
          >
            &#9660;
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full rounded-full metric-bar"
          style={{
            width: `${category.percentage}%`,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            boxShadow: `0 0 12px ${barColor}30`,
          }}
        />
      </div>

      {/* Expanded metrics */}
      {expanded && (
        <div className="mt-4 space-y-1.5 animate-fade-in">
          {category.metrics.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm transition-colors"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium" style={{ color: "#d1d1d6" }}>{m.name}</span>
                  <SignalBadge signal={m.signal} />
                </div>
                <div className="text-[11px] mt-0.5 font-mono" style={{ color: "#48484a" }}>
                  {m.formula}
                </div>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="font-mono text-[13px] font-semibold" style={{ color: "#f5f5f7" }}>
                  {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                </div>
                <div className="text-[10px]" style={{ color: "#48484a" }}>{m.sectorNote}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignalCard({
  title,
  metrics,
  color,
  icon,
}: {
  title: string;
  metrics: MetricScore[];
  color: string;
  icon: string;
}) {
  if (metrics.length === 0) return null;
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: color + "15", color }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold" style={{ color }}>
          {title}
        </h3>
      </div>
      <div className="space-y-1.5">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-3 rounded-xl text-[13px]"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <span className="font-medium" style={{ color: "#d1d1d6" }}>{m.name}</span>
            <span className="font-mono font-semibold" style={{ color }}>
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
    <div className="max-w-6xl mx-auto mt-8 space-y-6 animate-fade-in px-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="shimmer rounded-3xl h-64 w-full md:w-72 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="shimmer rounded-2xl h-10 w-3/4" />
          <div className="shimmer rounded-2xl h-7 w-1/2" />
          <div className="shimmer rounded-2xl h-24 w-full" />
          <div className="shimmer rounded-2xl h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="px-3 py-2 rounded-xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: "#636366" }}>
        {label}
      </div>
      <div className="text-[13px] font-semibold font-mono" style={{ color: "#e5e5e7" }}>
        {value}
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

      <div className="min-h-screen relative" style={{ background: "#050505" }}>
        {/* Background effects */}
        <div className="hero-glow" />
        <div className="grid-bg" />

        {/* Header */}
        <header
          className="sticky top-0 z-40"
          style={{
            background: "rgba(5,5,5,0.8)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-white animate-gradient"
                style={{ background: "var(--accent-gradient)", backgroundSize: "200% 200%" }}
              >
                S
              </div>
              <div>
                <span className="text-base font-bold tracking-tight" style={{ color: "#f5f5f7" }}>
                  StockGrade
                </span>
                <span className="hidden sm:inline text-xs ml-2 font-medium" style={{ color: "#636366" }}>
                  Pro
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-[11px] font-medium px-3 py-1.5 rounded-full"
                style={{ background: "rgba(48, 209, 88, 0.08)", color: "#30d158", border: "1px solid rgba(48,209,88,0.15)" }}
              >
                350+ Metrics
              </span>
            </div>
          </div>
        </header>

        {/* Hero / Search */}
        <div className={cn("transition-all duration-700 relative z-10", !searched ? "pt-28 pb-16" : "pt-6 pb-4")}>
          <div className="max-w-2xl mx-auto px-5 text-center">
            {!searched && (
              <div className="mb-10 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-6"
                  style={{ background: "rgba(10, 132, 255, 0.08)", color: "#0a84ff", border: "1px solid rgba(10,132,255,0.12)" }}
                >
                  Powered by institutional-grade analysis
                </div>
                <h1
                  className="text-5xl md:text-6xl font-black mb-4 tracking-tight leading-[1.1]"
                  style={{ color: "#f5f5f7" }}
                >
                  Evaluate Any{" "}
                  <span className="gradient-text">Stock</span>
                </h1>
                <p className="text-lg font-medium" style={{ color: "#8e8e93" }}>
                  Instant Buy/Sell ratings using 350+ quantitative metrics
                </p>
              </div>
            )}

            <form onSubmit={handleEvaluate} className="flex gap-2.5 max-w-xl mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter ticker (e.g. NVDA)"
                className="flex-1 px-5 py-3.5 rounded-2xl text-[15px] font-mono font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#f5f5f7",
                }}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="px-7 py-3.5 rounded-2xl font-semibold text-white text-[15px] transition-all disabled:opacity-30 cursor-pointer btn-glow animate-gradient"
                style={{
                  background: "var(--accent-gradient)",
                  backgroundSize: "200% 200%",
                  boxShadow: "0 4px 20px rgba(10, 132, 255, 0.15)",
                }}
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
              <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in stagger-2">
                {popular.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTicker(t);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#8e8e93",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(10, 132, 255, 0.3)";
                      e.currentTarget.style.color = "#f5f5f7";
                      e.currentTarget.style.background = "rgba(10, 132, 255, 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "#8e8e93";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }}
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
          <div className="max-w-2xl mx-auto px-5 mb-6 relative z-10">
            <div
              className="rounded-2xl p-4 text-sm font-medium animate-fade-in flex items-center gap-3"
              style={{
                background: "rgba(255, 69, 58, 0.06)",
                border: "1px solid rgba(255, 69, 58, 0.15)",
                color: "#ff453a",
              }}
            >
              <span className="text-lg">!</span>
              {error}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Results */}
        {result && !loading && (
          <div className="max-w-7xl mx-auto px-5 pb-20 relative z-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-5">
                {/* Company header + Score */}
                <div className="glass-card-static rounded-3xl p-7">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-7">
                    {/* Score gauge */}
                    <ScoreGauge
                      score={result.finalScore}
                      rating={result.rating}
                      ratingColor={result.ratingColor}
                    />

                    {/* Company info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3.5 mb-2">
                        {result.image && (
                          <img
                            src={result.image}
                            alt=""
                            className="w-12 h-12 rounded-xl"
                            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div>
                          <h2 className="text-2xl font-black tracking-tight" style={{ color: "#f5f5f7" }}>
                            {result.ticker}
                          </h2>
                          <p className="text-sm font-medium" style={{ color: "#8e8e93" }}>
                            {result.companyName}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="text-3xl font-black font-mono tracking-tight" style={{ color: "#f5f5f7" }}>
                          ${result.price.toFixed(2)}
                        </span>
                        <span
                          className="text-sm font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            color: result.change >= 0 ? "#30d158" : "#ff453a",
                            background: result.change >= 0 ? "rgba(48,209,88,0.1)" : "rgba(255,69,58,0.1)",
                          }}
                        >
                          {result.change >= 0 ? "+" : ""}
                          {result.change.toFixed(2)} ({result.changePercent.toFixed(2)}%)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {result.sector && (
                          <StatPill label="Sector" value={result.sector} />
                        )}
                        <StatPill label="Market Cap" value={formatNumber(result.marketCap)} />
                        {result.exchange && (
                          <StatPill label="Exchange" value={result.exchange} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verdict Banner */}
                <div
                  className="rounded-2xl p-5 flex items-center gap-4"
                  style={{
                    background: `linear-gradient(135deg, ${result.ratingColor}08, ${result.ratingColor}04)`,
                    border: `1px solid ${result.ratingColor}20`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                    style={{ background: result.ratingColor + "15", color: result.ratingColor }}
                  >
                    {result.finalScore}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: result.ratingColor }}>
                      Verdict: {result.rating}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#8e8e93" }}>
                      Based on {result.categories.reduce((sum, c) => sum + c.metrics.filter(m => m.value !== "N/A").length, 0)} evaluated metrics across {result.categories.length} categories
                    </div>
                  </div>
                </div>

                {/* Top signals and red flags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SignalCard
                    title="Top Buy Signals"
                    metrics={result.topSignals}
                    color="#30d158"
                    icon="&#9650;"
                  />
                  <SignalCard
                    title="Red Flags"
                    metrics={result.redFlags}
                    color="#ff453a"
                    icon="&#9660;"
                  />
                </div>

                {/* Category breakdown */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: "rgba(191, 90, 242, 0.1)", color: "#bf5af2" }}
                    >
                      M
                    </div>
                    <h2 className="text-lg font-bold tracking-tight" style={{ color: "#f5f5f7" }}>
                      Metric Categories
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {result.categories.map((cat, i) => (
                      <CategoryBar key={i} category={cat} index={i} />
                    ))}
                  </div>
                </div>

                {/* Scoring rubric */}
                <div className="glass-card-static rounded-2xl p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#636366" }}>
                    Scoring Scale
                  </h3>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { range: "75-100", label: "STRONG BUY", color: "#30d158" },
                      { range: "55-74", label: "BUY", color: "#4ade80" },
                      { range: "35-54", label: "HOLD", color: "#ffd60a" },
                      { range: "15-34", label: "UNDERWEIGHT", color: "#ff9f0a" },
                      { range: "0-14", label: "SELL", color: "#ff453a" },
                    ].map((r) => (
                      <div
                        key={r.label}
                        className="py-3 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div className="text-[11px] font-black tracking-wide" style={{ color: r.color }}>
                          {r.label}
                        </div>
                        <div className="text-[10px] mt-0.5 font-mono" style={{ color: "#48484a" }}>{r.range}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[11px] leading-relaxed" style={{ color: "#3a3a3c" }}>
                  This analysis is for informational and educational purposes only. It is not financial
                  advice. Past performance does not guarantee future results. Always conduct your own
                  due diligence and consult a licensed financial advisor before making investment decisions.
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
          <div className="max-w-3xl mx-auto px-5 pb-20 mt-4 relative z-10">
            <NewsSection />
          </div>
        )}

        {/* Footer */}
        <footer
          className="relative z-10 py-6 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-[11px]" style={{ color: "#3a3a3c" }}>
            StockGrade &copy; {new Date().getFullYear()} &middot; Not financial advice
          </p>
        </footer>
      </div>
    </>
  );
}
