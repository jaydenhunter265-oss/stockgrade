"use client";

import { useState, useRef } from "react";
import type { EvaluationResult, CategoryScore, MetricScore } from "@/lib/types";
import { formatNumber, cn } from "@/lib/utils";
import ScoreGauge from "@/components/score-gauge";

/* ──────────────── Small UI Atoms ──────────────── */

function SignalBadge({ signal }: { signal: "buy" | "neutral" | "sell" }) {
  const cls =
    signal === "buy"
      ? "signal-buy"
      : signal === "sell"
        ? "signal-sell"
        : "signal-neutral";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {signal}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-sm font-bold font-mono"
        style={{ color: "var(--text)" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function RangeBar({
  low,
  high,
  current,
  label,
}: {
  low: number;
  high: number;
  current: number;
  label: string;
}) {
  const pct =
    high > low
      ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100))
      : 50;
  return (
    <div className="mb-3">
      <div
        className="flex justify-between text-[10px] font-mono mb-1"
        style={{ color: "var(--text-muted)" }}
      >
        <span>${low.toFixed(2)}</span>
        <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
          {label}
        </span>
        <span>${high.toFixed(2)}</span>
      </div>
      <div
        className="relative h-1.5 rounded-full"
        style={{ background: "var(--border)" }}
      >
        <div
          className="absolute h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ef4444, #eab308, #10b981)",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2"
          style={{
            left: `calc(${pct}% - 5px)`,
            background: "var(--text)",
            borderColor: "var(--blue)",
          }}
        />
      </div>
    </div>
  );
}

/* ──────────────── Category Breakdown ──────────────── */

function CategoryBar({
  category,
  index,
}: {
  category: CategoryScore;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const barColor =
    category.percentage >= 65
      ? "#10b981"
      : category.percentage >= 40
        ? "#eab308"
        : "#ef4444";
  const barBg =
    category.percentage >= 65
      ? "rgba(16,185,129,0.08)"
      : category.percentage >= 40
        ? "rgba(234,179,8,0.06)"
        : "rgba(239,68,68,0.08)";

  const buyCount = category.metrics.filter((m) => m.score === 1).length;
  const sellCount = category.metrics.filter((m) => m.score === -1).length;
  const neutralCount = category.metrics.filter(
    (m) => m.score === 0 && m.value !== "N/A"
  ).length;

  return (
    <div
      className={cn(
        "rounded-xl p-4 cursor-pointer transition-colors animate-fade-in",
        `stagger-${Math.min(index + 1, 6)}`
      )}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: barBg, color: barColor }}
          >
            {category.percentage}
          </div>
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text)" }}
            >
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>
                {buyCount} buy
              </span>
              <span className="text-[10px]" style={{ color: "var(--border-hover)" }}>
                ·
              </span>
              <span className="text-[10px] font-medium" style={{ color: "#eab308" }}>
                {neutralCount} hold
              </span>
              <span className="text-[10px]" style={{ color: "var(--border-hover)" }}>
                ·
              </span>
              <span className="text-[10px] font-medium" style={{ color: "#ef4444" }}>
                {sellCount} sell
              </span>
            </div>
          </div>
        </div>
        <span
          className="text-xs transition-transform duration-200"
          style={{
            color: "var(--text-muted)",
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            display: "inline-block",
          }}
        >
          &#9660;
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full metric-bar"
          style={{
            width: `${category.percentage}%`,
            background: barColor,
          }}
        />
      </div>

      {/* Expanded metrics */}
      {expanded && (
        <div className="mt-3 space-y-1 animate-fade-in">
          {category.metrics.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg text-sm"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {m.name}
                  </span>
                  <SignalBadge signal={m.signal} />
                </div>
                <div
                  className="text-[11px] mt-0.5 font-mono"
                  style={{ color: "var(--text-dim)" }}
                >
                  {m.formula}
                </div>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div
                  className="font-mono text-[13px] font-semibold"
                  style={{ color: "var(--text)" }}
                >
                  {typeof m.value === "number"
                    ? m.value.toLocaleString()
                    : m.value}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                  {m.sectorNote}
                </div>
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

  const bgTint =
    color === "#10b981"
      ? "rgba(16,185,129,0.06)"
      : "rgba(239,68,68,0.06)";
  const badgeBg =
    color === "#10b981"
      ? "rgba(16,185,129,0.1)"
      : "rgba(239,68,68,0.1)";

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
          style={{ background: bgTint, color }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-semibold" style={{ color }}>
          {title}
        </h3>
        <span
          className="text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded"
          style={{ background: badgeBg, color }}
        >
          {metrics.length}
        </span>
      </div>
      <div className="space-y-1">
        {metrics.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[13px]"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <span
              className="font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {m.name}
            </span>
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

function CategorySummary({
  categories,
}: {
  categories: CategoryScore[];
}) {
  return (
    <div className="space-y-2">
      {categories.map((cat, i) => {
        const color =
          cat.percentage >= 65
            ? "#10b981"
            : cat.percentage >= 40
              ? "#eab308"
              : "#ef4444";
        return (
          <div key={i} className="flex items-center gap-3">
            <span
              className="text-[11px] font-medium w-28 truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {cat.name}
            </span>
            <div
              className="flex-1 h-1 rounded-full"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full metric-bar"
                style={{ width: `${cat.percentage}%`, background: color }}
              />
            </div>
            <span
              className="text-[11px] font-mono font-bold w-8 text-right"
              style={{ color }}
            >
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
    <div className="max-w-6xl mx-auto mt-8 px-4 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="shimmer rounded-xl h-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer rounded-lg h-20" />
            ))}
          </div>
          <div className="shimmer rounded-xl h-24" />
          <div className="grid grid-cols-2 gap-3">
            <div className="shimmer rounded-xl h-40" />
            <div className="shimmer rounded-xl h-40" />
          </div>
          <div className="shimmer rounded-xl h-36" />
          <div className="shimmer rounded-xl h-36" />
        </div>
        <div className="space-y-4">
          <div className="shimmer rounded-xl h-56" />
          <div className="shimmer rounded-xl h-48" />
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
    ? result.categories.reduce(
        (sum, c) => sum + c.metrics.filter((m) => m.value !== "N/A").length,
        0
      )
    : 0;
  const totalBuy = result
    ? result.categories.reduce(
        (sum, c) => sum + c.metrics.filter((m) => m.score === 1).length,
        0
      )
    : 0;
  const totalSell = result
    ? result.categories.reduce(
        (sum, c) => sum + c.metrics.filter((m) => m.score === -1).length,
        0
      )
    : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* ───── Header ───── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(9, 9, 11, 0.85)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
              style={{ background: "var(--blue)" }}
            >
              S
            </div>
            <span
              className="text-sm font-bold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              StockGrade
            </span>
          </div>

          {/* Inline search in header when results showing */}
          {searched && (
            <form
              onSubmit={handleEvaluate}
              className="hidden md:flex items-center gap-2 flex-1 max-w-sm mx-6"
            >
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Search ticker..."
                className="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono placeholder:text-zinc-600"
                style={{
                  background: "#1a1a1f",
                  border: "1px solid #333338",
                  color: "var(--text)",
                }}
              />
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white cursor-pointer disabled:opacity-30"
                style={{ background: "var(--blue)" }}
              >
                Go
              </button>
            </form>
          )}

          <span
            className="text-[10px] font-bold px-2 py-1 rounded-md tracking-wide"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--green)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            350+ METRICS
          </span>
        </div>
      </header>

      {/* ───── Hero / Search ───── */}
      {!searched ? (
        <div className="flex flex-col items-center justify-center px-4 text-center relative z-10" style={{ minHeight: "calc(100vh - 160px)" }}>
          {/* Subtle radial glow behind title */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)" }}
          />

          <div className="mb-10 animate-fade-in relative">
            <div
              className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
              style={{
                background: "rgba(59,130,246,0.08)",
                color: "var(--blue)",
                border: "1px solid rgba(59,130,246,0.15)",
              }}
            >
              Institutional-Grade Analysis
            </div>
            <h1
              className="text-5xl md:text-6xl font-black mb-5 tracking-tight leading-tight"
              style={{ color: "var(--text)" }}
            >
              Evaluate Any Stock
            </h1>
            <p
              className="text-lg max-w-lg mx-auto leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Comprehensive Buy/Sell ratings powered by 350+ quantitative
              metrics used by professional investors.
            </p>
          </div>

          <form
            onSubmit={handleEvaluate}
            className="flex gap-3 w-full max-w-md mx-auto animate-fade-in stagger-1 relative"
          >
            <input
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol..."
              className="flex-1 px-5 py-3.5 rounded-xl text-base font-mono transition-all placeholder:text-zinc-600"
              style={{
                background: "#1a1a1f",
                border: "1px solid #333338",
                color: "var(--text)",
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="px-7 py-3.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-30 cursor-pointer"
              style={{
                background: "var(--blue)",
                boxShadow: "0 0 20px rgba(59,130,246,0.2)",
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
          <div className="mt-6 flex flex-wrap justify-center gap-2.5 animate-fade-in stagger-2 relative">
            {popular.map((t) => (
              <button
                key={t}
                onClick={() => { setTicker(t); }}
                className="px-4 py-2 rounded-lg text-sm font-mono font-semibold cursor-pointer transition-all"
                style={{
                  background: "#141418",
                  border: "1px solid #2a2a2f",
                  color: "var(--text-muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.color = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2a2a2f";
                  e.currentTarget.style.color = "#71717a";
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pt-3 pb-2 relative z-10">
          <form
            onSubmit={handleEvaluate}
            className="flex gap-2 max-w-lg mx-auto px-4 md:hidden"
          >
            <input
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker symbol..."
              className="flex-1 px-4 py-3 rounded-xl text-sm font-mono placeholder:text-zinc-600"
              style={{
                background: "#1a1a1f",
                border: "1px solid #333338",
                color: "var(--text)",
              }}
            />
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="px-6 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-30 cursor-pointer"
              style={{ background: "var(--blue)" }}
            >
              {loading ? (
                <span className="pulse-glow">...</span>
              ) : (
                "Go"
              )}
            </button>
          </form>
        </div>
      )}

      {/* ───── Error ───── */}
      {error && (
        <div className="max-w-xl mx-auto px-4 mb-4 relative z-10">
          <div
            className="rounded-xl p-3 text-sm font-medium animate-fade-in flex items-center gap-2"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--red)",
            }}
          >
            <span className="flex-shrink-0">!</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ───── Loading ───── */}
      {loading && <LoadingSkeleton />}

      {/* ═══════════════ Results ═══════════════ */}
      {result && !loading && (
        <div className="max-w-6xl mx-auto px-4 pb-16 relative z-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* ──── Main Column (3/4) ──── */}
            <div className="lg:col-span-3 space-y-4">
              {/* ── Company Header ── */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Left: Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {result.image && (
                        <img
                          src={result.image}
                          alt=""
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                          style={{ border: "1px solid var(--border)" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h2
                            className="text-xl font-black tracking-tight"
                            style={{ color: "var(--text)" }}
                          >
                            {result.ticker}
                          </h2>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{
                              background: result.ratingColor + "18",
                              color: result.ratingColor,
                            }}
                          >
                            {result.rating}
                          </span>
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {result.companyName}
                        </p>
                        {result.sector && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {result.sector} · {result.industry}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex flex-wrap items-baseline gap-3 mb-3">
                      <span
                        className="text-3xl font-black font-mono tracking-tighter"
                        style={{ color: "var(--text)" }}
                      >
                        ${result.price.toFixed(2)}
                      </span>
                      <span
                        className="text-sm font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          color:
                            result.change >= 0
                              ? "var(--green)"
                              : "var(--red)",
                          background:
                            result.change >= 0
                              ? "rgba(16,185,129,0.1)"
                              : "rgba(239,68,68,0.1)",
                        }}
                      >
                        {result.change >= 0 ? "+" : ""}
                        {result.change.toFixed(2)} (
                        {result.changePercent.toFixed(2)}%)
                      </span>
                    </div>

                    {/* Price Ranges */}
                    {result.dayHigh > 0 && (
                      <RangeBar
                        low={result.dayLow}
                        high={result.dayHigh}
                        current={result.price}
                        label="Today"
                      />
                    )}
                    {result.yearHigh > 0 && (
                      <RangeBar
                        low={result.yearLow}
                        high={result.yearHigh}
                        current={result.price}
                        label="52 Week"
                      />
                    )}
                  </div>

                  {/* Right: Score Gauge */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <ScoreGauge
                      score={result.finalScore}
                      rating={result.rating}
                      ratingColor={result.ratingColor}
                      size={160}
                    />
                    <div className="mt-2 text-center">
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {totalMetrics} metrics evaluated
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-0.5">
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: "#10b981" }}
                        >
                          {totalBuy} buy
                        </span>
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: "#ef4444" }}
                        >
                          {totalSell} sell
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Key Statistics Grid ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatCard
                  label="Market Cap"
                  value={formatNumber(result.marketCap)}
                />
                <StatCard
                  label="P/E Ratio"
                  value={result.pe ? result.pe.toFixed(2) : "N/A"}
                />
                <StatCard
                  label="EPS"
                  value={
                    result.eps ? "$" + result.eps.toFixed(2) : "N/A"
                  }
                />
                <StatCard
                  label="Beta"
                  value={result.beta ? result.beta.toFixed(2) : "N/A"}
                  sub="Volatility"
                />
                <StatCard
                  label="Volume"
                  value={formatNumber(result.volume)}
                  sub="Today"
                />
                <StatCard
                  label="Avg Volume"
                  value={formatNumber(result.avgVolume)}
                />
                <StatCard
                  label="Open"
                  value={
                    result.open ? "$" + result.open.toFixed(2) : "N/A"
                  }
                />
                <StatCard
                  label="Prev Close"
                  value={
                    result.previousClose
                      ? "$" + result.previousClose.toFixed(2)
                      : "N/A"
                  }
                />
              </div>

              {/* ── Company Description ── */}
              {result.description && (
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="text-[11px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    About {result.companyName}
                  </h3>
                  <p
                    className={cn(
                      "text-[13px] leading-relaxed transition-all",
                      !descExpanded && "line-clamp-3"
                    )}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {result.description}
                  </p>
                  {result.description.length > 200 && (
                    <button
                      onClick={() => setDescExpanded(!descExpanded)}
                      className="text-[12px] font-semibold mt-1.5 cursor-pointer"
                      style={{ color: "var(--blue)" }}
                    >
                      {descExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              {/* ── Verdict Banner ── */}
              <div
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: result.ratingColor + "08",
                  border: `1px solid ${result.ratingColor}25`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0"
                  style={{
                    background: result.ratingColor + "15",
                    color: result.ratingColor,
                  }}
                >
                  {result.finalScore}
                </div>
                <div>
                  <div
                    className="text-sm font-black"
                    style={{ color: result.ratingColor }}
                  >
                    Verdict: {result.rating}
                  </div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Based on {totalMetrics} metrics across{" "}
                    {result.categories.length} categories.
                    {totalBuy > totalSell
                      ? ` ${totalBuy} buy vs ${totalSell} sell signals — positive outlook.`
                      : totalSell > totalBuy
                        ? ` ${totalSell} sell vs ${totalBuy} buy signals — exercise caution.`
                        : " Signals evenly split between buy and sell."}
                  </div>
                </div>
              </div>

              {/* ── Top Signals / Red Flags ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SignalCard
                  title="Top Buy Signals"
                  metrics={result.topSignals}
                  color="#10b981"
                  icon="&#9650;"
                />
                <SignalCard
                  title="Red Flags"
                  metrics={result.redFlags}
                  color="#ef4444"
                  icon="&#9660;"
                />
              </div>

              {/* ── Category Breakdown ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2
                    className="text-base font-bold tracking-tight"
                    style={{ color: "var(--text)" }}
                  >
                    Detailed Breakdown
                  </h2>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Click to expand
                  </span>
                </div>
                <div className="space-y-2">
                  {result.categories.map((cat, i) => (
                    <CategoryBar key={i} category={cat} index={i} />
                  ))}
                </div>
              </div>

              {/* ── Scoring Scale ── */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h3
                  className="text-[11px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Scoring Scale
                </h3>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[
                    { range: "75-100", label: "STRONG BUY", color: "#22c55e" },
                    { range: "55-74", label: "BUY", color: "#4ade80" },
                    { range: "35-54", label: "HOLD", color: "#eab308" },
                    { range: "15-34", label: "UNDERWEIGHT", color: "#f97316" },
                    { range: "0-14", label: "SELL", color: "#ef4444" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="py-2.5 rounded-lg"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="text-[9px] font-black tracking-wide"
                        style={{ color: r.color }}
                      >
                        {r.label}
                      </div>
                      <div
                        className="text-[9px] mt-0.5 font-mono"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {r.range}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Disclaimer ── */}
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--text-dim)" }}
              >
                This analysis is for informational and educational purposes only.
                It is not financial advice. Past performance does not guarantee
                future results. Always conduct your own due diligence and consult
                a licensed financial advisor before making investment decisions.
              </p>
            </div>

            {/* ──── Sidebar (1/4) ──── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="lg:sticky lg:top-16 space-y-4">
                {/* Category Summary */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="text-[11px] font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Category Scores
                  </h3>
                  <CategorySummary categories={result.categories} />
                </div>

                {/* Quick Info */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="text-[11px] font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Quick Info
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Exchange", value: result.exchange },
                      { label: "Sector", value: result.sector },
                      { label: "Industry", value: result.industry },
                      { label: "Country", value: result.country },
                    ]
                      .filter((item) => item.value)
                      .map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center"
                        >
                          <span
                            className="text-[11px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {item.label}
                          </span>
                          <span
                            className="text-[11px] font-semibold text-right max-w-[55%] truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {item.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Footer ───── */}
      <footer
        className="relative z-10 py-6 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>
            StockGrade &copy; {new Date().getFullYear()} &middot; Not financial
            advice
          </p>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "var(--text-dim)", opacity: 0.6 }}
          >
            Data provided by Yahoo Finance. Scores are algorithmically generated.
          </p>
        </div>
      </footer>
    </div>
  );
}
