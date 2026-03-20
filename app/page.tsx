"use client";

import { useState, useRef } from "react";
import type { EvaluationResult, CategoryScore, MetricScore } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";
import WelcomePopup from "@/components/welcome-popup";
import ScoreGauge from "@/components/score-gauge";
import NewsSection from "@/components/news-section";

/* ──────────────── Small UI Atoms ──────────────── */

function SignalBadge({ signal }: { signal: "buy" | "neutral" | "sell" }) {
  const cls = signal === "buy" ? "signal-buy" : signal === "sell" ? "signal-sell" : "signal-neutral";
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {signal}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#636366" }}>
        {label}
      </div>
      <div className="text-[15px] font-bold font-mono" style={{ color: "#f5f5f7" }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-0.5 font-medium" style={{ color: "#48484a" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  const pct = high > low ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: "#636366" }}>
        <span>${low.toFixed(2)}</span>
        <span className="font-semibold" style={{ color: "#8e8e93" }}>{label}</span>
        <span>${high.toFixed(2)}</span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff453a, #ffd60a, #30d158)",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2"
          style={{
            left: `calc(${pct}% - 5px)`,
            background: "#f5f5f7",
            borderColor: "#0a84ff",
            boxShadow: "0 0 8px rgba(10,132,255,0.4)",
          }}
        />
      </div>
    </div>
  );
}

/* ──────────────── Category Breakdown ──────────────── */

function CategoryBar({ category, index }: { category: CategoryScore; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const barColor =
    category.percentage >= 65 ? "#30d158" : category.percentage >= 40 ? "#ffd60a" : "#ff453a";
  const barBg =
    category.percentage >= 65 ? "rgba(48,209,88,0.08)" : category.percentage >= 40 ? "rgba(255,214,10,0.06)" : "rgba(255,69,58,0.08)";

  const buyCount = category.metrics.filter(m => m.score === 1).length;
  const sellCount = category.metrics.filter(m => m.score === -1).length;
  const neutralCount = category.metrics.filter(m => m.score === 0 && m.value !== "N/A").length;

  return (
    <div
      className={cn("glass-card rounded-2xl p-5 cursor-pointer animate-fade-in", `stagger-${Math.min(index + 1, 6)}`)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: barBg, color: barColor }}
          >
            {category.percentage}
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#e5e5e7" }}>
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold" style={{ color: "#30d158" }}>{buyCount} buy</span>
              <span className="text-[10px]" style={{ color: "#3a3a3c" }}>·</span>
              <span className="text-[10px] font-semibold" style={{ color: "#ffd60a" }}>{neutralCount} hold</span>
              <span className="text-[10px]" style={{ color: "#3a3a3c" }}>·</span>
              <span className="text-[10px] font-semibold" style={{ color: "#ff453a" }}>{sellCount} sell</span>
            </div>
          </div>
        </div>
        <span
          className="text-xs transition-transform duration-300"
          style={{
            color: "#636366",
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            display: "inline-block",
          }}
        >
          &#9660;
        </span>
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

/* ──────────────── Signal Cards ──────────────── */

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
        <span className="text-[10px] font-mono ml-auto px-2 py-0.5 rounded-md" style={{ background: color + "10", color }}>
          {metrics.length} signals
        </span>
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

/* ──────────────── Category Summary Mini Bars ──────────────── */

function CategorySummary({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="space-y-2">
      {categories.map((cat, i) => {
        const color = cat.percentage >= 65 ? "#30d158" : cat.percentage >= 40 ? "#ffd60a" : "#ff453a";
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] font-medium w-28 truncate" style={{ color: "#8e8e93" }}>
              {cat.name}
            </span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div
                className="h-full rounded-full metric-bar"
                style={{
                  width: `${cat.percentage}%`,
                  background: color,
                  boxShadow: `0 0 6px ${color}30`,
                }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color }}>
              {cat.percentage}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────── Loading Skeleton ──────────────── */

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto mt-8 px-5 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <div className="shimmer rounded-3xl h-72" />
          <div className="grid grid-cols-2 gap-4">
            <div className="shimmer rounded-2xl h-40" />
            <div className="shimmer rounded-2xl h-40" />
          </div>
          <div className="shimmer rounded-2xl h-48" />
          <div className="shimmer rounded-2xl h-48" />
        </div>
        <div className="space-y-5">
          <div className="shimmer rounded-2xl h-64" />
          <div className="shimmer rounded-2xl h-96" />
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main Page ──────────────── */

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
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

  const totalMetrics = result
    ? result.categories.reduce((sum, c) => sum + c.metrics.filter(m => m.value !== "N/A").length, 0)
    : 0;
  const totalBuy = result
    ? result.categories.reduce((sum, c) => sum + c.metrics.filter(m => m.score === 1).length, 0)
    : 0;
  const totalSell = result
    ? result.categories.reduce((sum, c) => sum + c.metrics.filter(m => m.score === -1).length, 0)
    : 0;

  return (
    <>
      <WelcomePopup />

      <div className="min-h-screen relative" style={{ background: "#050505" }}>
        {/* Background effects */}
        <div className="hero-glow" />
        <div className="grid-bg" />

        {/* ───── Header ───── */}
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
                <span className="hidden sm:inline text-[10px] ml-2 px-1.5 py-0.5 rounded font-bold tracking-wider"
                  style={{ background: "rgba(191,90,242,0.15)", color: "#bf5af2" }}
                >
                  PRO
                </span>
              </div>
            </div>

            {/* Inline search in header when results showing */}
            {searched && (
              <form onSubmit={handleEvaluate} className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Search ticker..."
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-mono"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#f5f5f7",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading || !ticker.trim()}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-30"
                  style={{ background: "var(--accent-gradient)", backgroundSize: "200% 200%" }}
                >
                  Go
                </button>
              </form>
            )}

            <div className="flex items-center gap-3">
              <span
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-full tracking-wide"
                style={{ background: "rgba(48, 209, 88, 0.08)", color: "#30d158", border: "1px solid rgba(48,209,88,0.15)" }}
              >
                350+ METRICS
              </span>
            </div>
          </div>
        </header>

        {/* ───── Hero / Search ───── */}
        <div className={cn("transition-all duration-700 relative z-10", !searched ? "pt-24 pb-12" : "pt-4 pb-3")}>
          <div className="max-w-2xl mx-auto px-5 text-center">
            {!searched && (
              <div className="mb-10 animate-fade-in">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold mb-6"
                  style={{ background: "rgba(10, 132, 255, 0.08)", color: "#0a84ff", border: "1px solid rgba(10,132,255,0.12)" }}
                >
                  Institutional-grade stock analysis
                </div>
                <h1
                  className="text-5xl md:text-7xl font-black mb-5 tracking-tight leading-[1.05]"
                  style={{ color: "#f5f5f7" }}
                >
                  Know Before<br />
                  You <span className="gradient-text">Invest</span>
                </h1>
                <p className="text-lg font-medium max-w-lg mx-auto" style={{ color: "#8e8e93" }}>
                  Comprehensive Buy/Sell ratings powered by 350+ quantitative metrics
                  used by professional investors and hedge funds.
                </p>
              </div>
            )}

            <form onSubmit={handleEvaluate} className={cn("flex gap-2.5 max-w-xl mx-auto", searched && "md:hidden")}>
              <input
                ref={inputRef}
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter ticker symbol (e.g. NVDA)"
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
                {loading ? <span className="pulse-glow">Analyzing...</span> : "Evaluate"}
              </button>
            </form>

            {/* Popular tickers */}
            {!searched && (
              <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in stagger-2">
                {popular.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTicker(t); }}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all hover:border-blue-500/30 hover:text-white hover:bg-blue-500/5"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#8e8e93",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ───── Error ───── */}
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
              <span className="text-lg flex-shrink-0">!</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* ───── Loading ───── */}
        {loading && <LoadingSkeleton />}

        {/* ═══════════════ Results ═══════════════ */}
        {result && !loading && (
          <div className="max-w-7xl mx-auto px-5 pb-20 relative z-10 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

              {/* ──── Main Column (3/4) ──── */}
              <div className="lg:col-span-3 space-y-5">

                {/* ── Company Header ── */}
                <div className="glass-card-static rounded-3xl p-6 md:p-7">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        {result.image && (
                          <img
                            src={result.image}
                            alt=""
                            className="w-14 h-14 rounded-2xl flex-shrink-0"
                            style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black tracking-tight" style={{ color: "#f5f5f7" }}>
                              {result.ticker}
                            </h2>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                              style={{ background: result.ratingColor + "18", color: result.ratingColor }}
                            >
                              {result.rating}
                            </span>
                          </div>
                          <p className="text-sm font-medium" style={{ color: "#8e8e93" }}>
                            {result.companyName}
                          </p>
                          {result.sector && (
                            <p className="text-[11px] mt-0.5" style={{ color: "#636366" }}>
                              {result.sector} · {result.industry}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-wrap items-baseline gap-3 mb-4">
                        <span className="text-4xl font-black font-mono tracking-tighter" style={{ color: "#f5f5f7" }}>
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

                      {/* Price Ranges */}
                      {result.dayHigh > 0 && (
                        <RangeBar low={result.dayLow} high={result.dayHigh} current={result.price} label="Today" />
                      )}
                      {result.yearHigh > 0 && (
                        <RangeBar low={result.yearLow} high={result.yearHigh} current={result.price} label="52 Week" />
                      )}
                    </div>

                    {/* Right: Score Gauge */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <ScoreGauge
                        score={result.finalScore}
                        rating={result.rating}
                        ratingColor={result.ratingColor}
                        size={180}
                      />
                      <div className="mt-3 text-center">
                        <div className="text-xs font-medium" style={{ color: "#8e8e93" }}>
                          {totalMetrics} metrics evaluated
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-1">
                          <span className="text-[11px] font-bold" style={{ color: "#30d158" }}>{totalBuy} buy</span>
                          <span className="text-[11px] font-bold" style={{ color: "#ff453a" }}>{totalSell} sell</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Key Statistics Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <StatCard label="Market Cap" value={formatNumber(result.marketCap)} />
                  <StatCard label="P/E Ratio" value={result.pe ? result.pe.toFixed(2) : "N/A"} />
                  <StatCard label="EPS" value={result.eps ? "$" + result.eps.toFixed(2) : "N/A"} />
                  <StatCard label="Beta" value={result.beta ? result.beta.toFixed(2) : "N/A"} sub="Volatility" />
                  <StatCard label="Volume" value={formatNumber(result.volume)} sub="Today" />
                  <StatCard label="Avg Volume" value={formatNumber(result.avgVolume)} />
                  <StatCard label="Open" value={result.open ? "$" + result.open.toFixed(2) : "N/A"} />
                  <StatCard label="Prev Close" value={result.previousClose ? "$" + result.previousClose.toFixed(2) : "N/A"} />
                </div>

                {/* ── Company Description ── */}
                {result.description && (
                  <div className="glass-card-static rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#636366" }}>
                      About {result.companyName}
                    </h3>
                    <p
                      className={cn("text-[13px] leading-relaxed transition-all", !descExpanded && "line-clamp-3")}
                      style={{ color: "#a1a1a6" }}
                    >
                      {result.description}
                    </p>
                    {result.description.length > 200 && (
                      <button
                        onClick={() => setDescExpanded(!descExpanded)}
                        className="text-[12px] font-semibold mt-2 cursor-pointer"
                        style={{ color: "#0a84ff" }}
                      >
                        {descExpanded ? "Show less" : "Read more"}
                      </button>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      {result.exchange && (
                        <div className="text-[11px]">
                          <span style={{ color: "#636366" }}>Exchange: </span>
                          <span className="font-semibold" style={{ color: "#d1d1d6" }}>{result.exchange}</span>
                        </div>
                      )}
                      {result.country && (
                        <div className="text-[11px]">
                          <span style={{ color: "#636366" }}>Country: </span>
                          <span className="font-semibold" style={{ color: "#d1d1d6" }}>{result.country}</span>
                        </div>
                      )}
                      {result.ipoDate && (
                        <div className="text-[11px]">
                          <span style={{ color: "#636366" }}>IPO: </span>
                          <span className="font-semibold" style={{ color: "#d1d1d6" }}>{result.ipoDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Verdict Banner ── */}
                <div
                  className="rounded-2xl p-5 flex items-center gap-5"
                  style={{
                    background: `linear-gradient(135deg, ${result.ratingColor}0a, ${result.ratingColor}04)`,
                    border: `1px solid ${result.ratingColor}20`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black flex-shrink-0"
                    style={{ background: result.ratingColor + "15", color: result.ratingColor }}
                  >
                    {result.finalScore}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-black" style={{ color: result.ratingColor }}>
                      Verdict: {result.rating}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#8e8e93" }}>
                      Based on {totalMetrics} evaluated metrics across {result.categories.length} categories.
                      {totalBuy > totalSell
                        ? ` ${totalBuy} metrics signal buy vs ${totalSell} sell — overall positive.`
                        : totalSell > totalBuy
                          ? ` ${totalSell} metrics signal sell vs ${totalBuy} buy — exercise caution.`
                          : " Metrics are evenly split between buy and sell signals."}
                    </div>
                  </div>
                </div>

                {/* ── Top Signals / Red Flags ── */}
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

                {/* ── Category Breakdown ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                        style={{ background: "rgba(191, 90, 242, 0.1)", color: "#bf5af2" }}
                      >
                        M
                      </div>
                      <h2 className="text-lg font-bold tracking-tight" style={{ color: "#f5f5f7" }}>
                        Detailed Breakdown
                      </h2>
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: "#636366" }}>
                      Click to expand
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {result.categories.map((cat, i) => (
                      <CategoryBar key={i} category={cat} index={i} />
                    ))}
                  </div>
                </div>

                {/* ── Scoring Scale ── */}
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
                        <div className="text-[10px] font-black tracking-wide" style={{ color: r.color }}>
                          {r.label}
                        </div>
                        <div className="text-[10px] mt-0.5 font-mono" style={{ color: "#48484a" }}>{r.range}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Disclaimer ── */}
                <p className="text-[11px] leading-relaxed" style={{ color: "#3a3a3c" }}>
                  This analysis is for informational and educational purposes only. It is not financial
                  advice. Past performance does not guarantee future results. Always conduct your own
                  due diligence and consult a licensed financial advisor before making investment decisions.
                </p>
              </div>

              {/* ──── Sidebar (1/4) ──── */}
              <div className="lg:col-span-1 space-y-5">
                <div className="lg:sticky lg:top-20 space-y-5">

                  {/* Category Summary */}
                  <div className="glass-card-static rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#636366" }}>
                      Category Scores
                    </h3>
                    <CategorySummary categories={result.categories} />
                  </div>

                  {/* Quick Info */}
                  <div className="glass-card-static rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#636366" }}>
                      Quick Info
                    </h3>
                    <div className="space-y-2.5">
                      {[
                        { label: "Exchange", value: result.exchange },
                        { label: "Sector", value: result.sector },
                        { label: "Industry", value: result.industry },
                        { label: "Country", value: result.country },
                        { label: "IPO Date", value: result.ipoDate },
                      ]
                        .filter((item) => item.value)
                        .map((item) => (
                          <div key={item.label} className="flex justify-between items-center">
                            <span className="text-[11px]" style={{ color: "#636366" }}>{item.label}</span>
                            <span className="text-[11px] font-semibold text-right max-w-[55%] truncate" style={{ color: "#d1d1d6" }}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* News */}
                  <NewsSection ticker={result.ticker} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───── Default news when no search ───── */}
        {!searched && !loading && (
          <div className="max-w-3xl mx-auto px-5 pb-20 mt-4 relative z-10">
            <NewsSection />
          </div>
        )}

        {/* ───── Footer ───── */}
        <footer
          className="relative z-10 py-8 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="max-w-7xl mx-auto px-5">
            <p className="text-[11px] mb-1" style={{ color: "#3a3a3c" }}>
              StockGrade &copy; {new Date().getFullYear()} &middot; Not financial advice
            </p>
            <p className="text-[10px]" style={{ color: "#2a2a2a" }}>
              Data provided by Financial Modeling Prep. Scores are algorithmically generated.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
