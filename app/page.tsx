"use client";

import { useState, useRef, useEffect } from "react";
import type { EvaluationResult, CategoryScore, MetricScore } from "@/lib/types";
import { formatNumber, cn, timeAgo } from "@/lib/utils";
import ScoreGauge from "@/components/score-gauge";

/* ══════════════════ Types ══════════════════ */

interface TopStockItem {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  finalScore: number;
  rating: string;
  ratingColor: string;
  image: string;
}

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}

/* ══════════════════ Local Storage ══════════════════ */

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem("stockgrade-recent");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(ticker: string) {
  try {
    const recent = getRecentSearches().filter((t) => t !== ticker);
    recent.unshift(ticker);
    localStorage.setItem("stockgrade-recent", JSON.stringify(recent.slice(0, 8)));
  } catch {}
}

/* ══════════════════ Small Components ══════════════════ */

function SignalBadge({ signal }: { signal: "buy" | "neutral" | "sell" }) {
  const cls =
    signal === "buy" ? "signal-buy" : signal === "sell" ? "signal-sell" : "signal-neutral";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {signal}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card rounded-xl p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-dim)" }}>
        {label}
      </div>
      <div className="text-base font-bold font-mono" style={{ color: "var(--text)" }}>
        {value}
      </div>
      {sub && <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>{sub}</div>}
    </div>
  );
}

function RangeBar({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  const pct = high > low ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>
        <span>${low.toFixed(2)}</span>
        <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span>${high.toFixed(2)}</span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: "var(--border)" }}>
        <div
          className="absolute h-full rounded-full"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)" }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2"
          style={{ left: `calc(${pct}% - 5px)`, background: "var(--text)", borderColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}

/* ══════════════════ Category Components ══════════════════ */

function CategoryBar({ category, index }: { category: CategoryScore; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const barColor = category.percentage >= 65 ? "#10b981" : category.percentage >= 40 ? "#f59e0b" : "#ef4444";
  const barBg = category.percentage >= 65 ? "rgba(16,185,129,0.06)" : category.percentage >= 40 ? "rgba(245,158,11,0.05)" : "rgba(239,68,68,0.06)";
  const buyCount = category.metrics.filter((m) => m.score === 1).length;
  const sellCount = category.metrics.filter((m) => m.score === -1).length;
  const neutralCount = category.metrics.filter((m) => m.score === 0 && m.value !== "N/A").length;

  return (
    <div
      className={cn("card card-interactive rounded-xl p-4 animate-fade-in", `stagger-${Math.min(index + 1, 6)}`)}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black" style={{ background: barBg, color: barColor }}>
            {category.percentage}
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>{category.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>{buyCount} buy</span>
              <span className="text-[10px]" style={{ color: "var(--border-hover)" }}>·</span>
              <span className="text-[10px] font-medium" style={{ color: "#f59e0b" }}>{neutralCount} hold</span>
              <span className="text-[10px]" style={{ color: "var(--border-hover)" }}>·</span>
              <span className="text-[10px] font-medium" style={{ color: "#ef4444" }}>{sellCount} sell</span>
            </div>
          </div>
        </div>
        <span
          className="text-xs transition-transform duration-200"
          style={{ color: "var(--text-muted)", transform: expanded ? "rotate(180deg)" : "rotate(0)", display: "inline-block" }}
        >
          &#9660;
        </span>
      </div>

      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full metric-bar" style={{ width: `${category.percentage}%`, background: barColor }} />
      </div>

      {expanded && (
        <div className="mt-3 space-y-1 animate-fade-in">
          {category.metrics.map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.015)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>{m.name}</span>
                  <SignalBadge signal={m.signal} />
                </div>
                <div className="text-[11px] mt-0.5 font-mono" style={{ color: "var(--text-dim)" }}>{m.formula}</div>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <div className="font-mono text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                  {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>{m.sectorNote}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignalCard({ title, metrics, color, icon }: { title: string; metrics: MetricScore[]; color: string; icon: string }) {
  if (metrics.length === 0) return null;
  const bgTint = color === "#10b981" ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)";
  const badgeBg = color === "#10b981" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)";
  return (
    <div className="card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: bgTint, color }}>{icon}</div>
        <h3 className="text-sm font-semibold" style={{ color }}>{title}</h3>
        <span className="text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded" style={{ background: badgeBg, color }}>{metrics.length}</span>
      </div>
      <div className="space-y-1">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[13px]" style={{ background: "rgba(255,255,255,0.015)" }}>
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{m.name}</span>
            <span className="font-mono font-semibold" style={{ color }}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategorySummary({ categories }: { categories: CategoryScore[] }) {
  return (
    <div className="space-y-2">
      {categories.map((cat, i) => {
        const color = cat.percentage >= 65 ? "#10b981" : cat.percentage >= 40 ? "#f59e0b" : "#ef4444";
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[11px] font-medium w-28 truncate" style={{ color: "var(--text-secondary)" }}>{cat.name}</span>
            <div className="flex-1 h-1 rounded-full" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full metric-bar" style={{ width: `${cat.percentage}%`, background: color }} />
            </div>
            <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color }}>{cat.percentage}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════ Skeletons ══════════════════ */

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto mt-8 px-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="shimmer rounded-xl h-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="shimmer rounded-xl h-20" />)}
          </div>
          <div className="shimmer rounded-xl h-24" />
          <div className="grid grid-cols-2 gap-3">
            <div className="shimmer rounded-xl h-40" />
            <div className="shimmer rounded-xl h-40" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="shimmer rounded-xl h-56" />
          <div className="shimmer rounded-xl h-48" />
        </div>
      </div>
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => <div key={i} className="shimmer rounded-lg h-[52px]" />)}
    </div>
  );
}

/* ══════════════════ Dashboard Components ══════════════════ */

function TopStockRow({
  stock,
  rank,
  type,
  onEvaluate,
}: {
  stock: TopStockItem;
  rank: number;
  type: "buy" | "sell";
  onEvaluate: (ticker: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all group stock-row"
      style={{ background: rank === 1 ? "rgba(255,255,255,0.02)" : "transparent" }}
      onClick={() => onEvaluate(stock.ticker)}
    >
      {/* Rank */}
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style={{
          color: type === "buy"
            ? (rank <= 2 ? "#10b981" : "var(--text-muted)")
            : (rank <= 2 ? "#ef4444" : "var(--text-muted)"),
          background: type === "buy"
            ? (rank <= 2 ? "rgba(16,185,129,0.1)" : "transparent")
            : (rank <= 2 ? "rgba(239,68,68,0.1)" : "transparent"),
        }}
      >
        {rank}
      </div>

      {/* Logo + Info */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {stock.image && (
          <img
            src={stock.image}
            alt=""
            className="w-7 h-7 rounded-md flex-shrink-0"
            style={{ border: "1px solid var(--border)" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold font-mono" style={{ color: "var(--text)" }}>{stock.ticker}</span>
            <span
              className="text-[8px] font-bold px-1 py-0.5 rounded"
              style={{ background: stock.ratingColor + "15", color: stock.ratingColor }}
            >
              {stock.rating}
            </span>
          </div>
          <div className="text-[10px] truncate" style={{ color: "var(--text-dim)" }}>
            {stock.companyName}
          </div>
        </div>
      </div>

      {/* Price + Change */}
      <div className="text-right flex-shrink-0 hidden sm:block">
        <div className="text-[13px] font-mono font-semibold" style={{ color: "var(--text)" }}>
          ${stock.price.toFixed(2)}
        </div>
        <div
          className="text-[10px] font-mono font-semibold"
          style={{ color: stock.change >= 0 ? "var(--green)" : "var(--red)" }}
        >
          {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
        </div>
      </div>

      {/* Score */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-black flex-shrink-0"
        style={{ background: stock.ratingColor + "10", color: stock.ratingColor }}
      >
        {stock.finalScore}
      </div>

      {/* Arrow */}
      <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-muted)" }}>
        &#8250;
      </span>
    </div>
  );
}

function NewsCard({ article }: { article: NewsItem }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="card news-card rounded-xl overflow-hidden block"
    >
      {article.thumbnail && (
        <div className="w-full h-32 overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      )}
      <div className="p-3.5">
        <h4 className="text-[13px] font-semibold leading-snug mb-2 line-clamp-2" style={{ color: "var(--text)" }}>
          {article.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-dim)" }}>
          <span className="font-medium" style={{ color: "var(--text-muted)" }}>{article.publisher}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </a>
  );
}

/* ══════════════════ Main Page ══════════════════ */

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [topStocks, setTopStocks] = useState<{ topBuy: TopStockItem[]; topSell: TopStockItem[] } | null>(null);
  const [topStocksLoading, setTopStocksLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());

    const params = new URLSearchParams(window.location.search);
    const t = params.get("ticker");
    if (t) {
      setTicker(t.toUpperCase());
      handleEvaluateDirect(t.toUpperCase());
    }

    fetch("/api/top-stocks")
      .then((res) => res.json())
      .then((data) => setTopStocks(data))
      .catch(() => {})
      .finally(() => setTopStocksLoading(false));

    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setNews(data.news || []))
      .catch(() => {})
      .finally(() => setNewsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEvaluateDirect(t: string) {
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
      addRecentSearch(t);
      setRecentSearches(getRecentSearches());
      window.history.pushState({}, "", `?ticker=${t}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate(e?: React.FormEvent) {
    e?.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setTicker(t);
    await handleEvaluateDirect(t);
  }

  function goHome() {
    setSearched(false);
    setResult(null);
    setError("");
    setTicker("");
    window.history.pushState({}, "", "/");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const popular = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "JPM"];

  const totalMetrics = result
    ? result.categories.reduce((sum, c) => sum + c.metrics.filter((m) => m.value !== "N/A").length, 0)
    : 0;
  const totalBuy = result
    ? result.categories.reduce((sum, c) => sum + c.metrics.filter((m) => m.score === 1).length, 0)
    : 0;
  const totalSell = result
    ? result.categories.reduce((sum, c) => sum + c.metrics.filter((m) => m.score === -1).length, 0)
    : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* ═══════ Header ═══════ */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(9, 9, 11, 0.92)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={goHome}>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-black text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}
            >
              S
            </div>
            <span className="text-[13px] font-bold tracking-tight group-hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
              StockGrade
            </span>
          </div>

          {/* Header search when viewing results */}
          {searched && (
            <form onSubmit={handleEvaluate} className="hidden md:flex items-center gap-2 flex-1 max-w-sm mx-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Search ticker..."
                  className="w-full px-3 py-1.5 rounded-lg text-[13px] font-mono placeholder:text-zinc-600"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
                {ticker && (
                  <button
                    type="button"
                    onClick={() => setTicker("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white cursor-pointer text-xs"
                  >
                    &#10005;
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="px-4 py-1.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-30"
                style={{ background: "var(--accent)" }}
              >
                Go
              </button>
            </form>
          )}

          <div className="flex items-center gap-3">
            {searched && (
              <button
                onClick={goHome}
                className="text-[11px] font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors hidden md:block hover:bg-white/5"
                style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                &#8592; Home
              </button>
            )}
            <div
              className="text-[9px] font-bold px-2.5 py-1 rounded-md tracking-widest"
              style={{ background: "rgba(99, 102, 241, 0.08)", color: "var(--accent)", border: "1px solid rgba(99, 102, 241, 0.15)" }}
            >
              350+ METRICS
            </div>
          </div>
        </div>
      </header>

      {/* ═══════ Home View ═══════ */}
      {!searched ? (
        <div className="flex-1">
          {/* Hero + Search */}
          <div className="relative grid-pattern">
            {/* Gradient orbs */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 60%)" }}
            />
            <div
              className="absolute top-40 left-1/4 w-[300px] h-[300px] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col items-center px-6 pt-20 pb-16">
              {/* Badge */}
              <div
                className="text-[10px] font-bold uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full mb-8 animate-fade-in"
                style={{ background: "rgba(99,102,241,0.06)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                Institutional-Grade Analysis
              </div>

              {/* Title */}
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-center mb-5 animate-fade-in stagger-1"
                style={{ color: "var(--text)", lineHeight: 1.05 }}
              >
                Evaluate Any
                <br />
                <span style={{ color: "var(--accent)" }}>Stock</span>
              </h1>

              <p className="text-base sm:text-lg text-center max-w-md mb-10 animate-fade-in stagger-2" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                350+ quantitative metrics. Instant Buy/Sell ratings. The analysis pros use, available to everyone.
              </p>

              {/* Search Box */}
              <form onSubmit={handleEvaluate} className="w-full max-w-2xl mx-auto animate-fade-in stagger-2">
                <div className="search-input-wrapper">
                  <div className="search-input-inner">
                    <div className="flex items-center gap-3 px-5 text-zinc-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      placeholder="Search any ticker symbol... AAPL, TSLA, NVDA"
                      className="flex-1 py-5 text-lg font-mono bg-transparent placeholder:text-zinc-600 tracking-wide"
                      style={{ color: "var(--text)", border: "none", outline: "none" }}
                      autoFocus
                    />
                    {ticker && (
                      <button
                        type="button"
                        onClick={() => { setTicker(""); inputRef.current?.focus(); }}
                        className="px-3 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                      >
                        &#10005;
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !ticker.trim()}
                      className="m-2 px-8 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-30 cursor-pointer hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}
                    >
                      {loading ? <span className="pulse-glow">Analyzing...</span> : "Evaluate"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-5 flex items-center gap-2 animate-fade-in stagger-3">
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Recent</span>
                  <div className="w-px h-3" style={{ background: "var(--border)" }} />
                  {recentSearches.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTicker(t); handleEvaluateDirect(t); }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer transition-colors hover:bg-white/5"
                      style={{ color: "var(--accent)", border: "1px solid rgba(99,102,241,0.15)" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Tickers */}
              <div className="mt-5 flex flex-wrap justify-center gap-2 animate-fade-in stagger-3">
                {popular.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTicker(t)}
                    className="px-4 py-2 rounded-lg text-[13px] font-mono font-semibold cursor-pointer ticker-btn"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ Rankings ═══════ */}
          <div className="w-full max-w-5xl mx-auto px-6 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top 5 Highest */}
              <div className="card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
                <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
                  <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Top 5 Highest Rated</h2>
                  <span className="text-[9px] font-bold ml-auto px-2 py-0.5 rounded tracking-wider" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>
                    BEST BUYS
                  </span>
                </div>
                {topStocksLoading ? (
                  <RankingSkeleton />
                ) : topStocks?.topBuy?.length ? (
                  <div className="space-y-0.5">
                    {topStocks.topBuy.map((stock, i) => (
                      <TopStockRow key={stock.ticker} stock={stock} rank={i + 1} type="buy" onEvaluate={handleEvaluateDirect} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-sm" style={{ color: "var(--text-dim)" }}>No data available</div>
                )}
              </div>

              {/* Top 5 Lowest */}
              <div className="card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
                <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--red)" }} />
                  <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Top 5 Lowest Rated</h2>
                  <span className="text-[9px] font-bold ml-auto px-2 py-0.5 rounded tracking-wider" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                    WEAKEST
                  </span>
                </div>
                {topStocksLoading ? (
                  <RankingSkeleton />
                ) : topStocks?.topSell?.length ? (
                  <div className="space-y-0.5">
                    {topStocks.topSell.map((stock, i) => (
                      <TopStockRow key={stock.ticker} stock={stock} rank={i + 1} type="sell" onEvaluate={handleEvaluateDirect} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-sm" style={{ color: "var(--text-dim)" }}>No data available</div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════ News ═══════ */}
          <div className="w-full max-w-5xl mx-auto px-6 pb-12">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--blue)" }} />
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Market News</h2>
              <div className="flex-1 h-px ml-2" style={{ background: "var(--border)" }} />
              <span className="text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>
                Yahoo Finance
              </span>
            </div>
            {newsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer rounded-xl h-52" />)}
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {news.slice(0, 8).map((article, i) => (
                  <NewsCard key={i} article={article} />
                ))}
              </div>
            ) : (
              <div className="card rounded-xl p-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  News currently unavailable.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Mobile search bar when in results view */
        <div className="pt-3 pb-2 relative z-10">
          <div className="flex gap-2 max-w-lg mx-auto px-6 md:hidden">
            <button
              onClick={goHome}
              className="px-3 py-3 rounded-xl font-semibold text-sm cursor-pointer"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              &#8592;
            </button>
            <form onSubmit={handleEvaluate} className="flex gap-2 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="Enter ticker..."
                className="flex-1 px-4 py-3 rounded-xl text-sm font-mono placeholder:text-zinc-600"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="px-6 py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-30 cursor-pointer"
                style={{ background: "var(--accent)" }}
              >
                {loading ? <span className="pulse-glow">...</span> : "Go"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ Error ═══════ */}
      {error && (
        <div className="max-w-xl mx-auto px-6 mb-4 relative z-10">
          <div
            className="rounded-xl p-3 text-sm font-medium animate-fade-in flex items-center gap-2"
            style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.15)", color: "var(--red)" }}
          >
            <span className="flex-shrink-0">!</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ═══════ Loading ═══════ */}
      {loading && <LoadingSkeleton />}

      {/* ══════════════════ Results ══════════════════ */}
      {result && !loading && (
        <div className="w-full max-w-6xl mx-auto px-6 pb-16 relative z-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* ──── Main Column (3/4) ──── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Company Header */}
              <div className="card rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {result.image && (
                        <img
                          src={result.image}
                          alt=""
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                          style={{ border: "1px solid var(--border)" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>{result.ticker}</h2>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ background: result.ratingColor + "15", color: result.ratingColor }}
                          >
                            {result.rating}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{result.companyName}</p>
                        {result.sector && (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {result.sector} · {result.industry}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3 mb-4">
                      <span className="text-4xl font-black font-mono tracking-tighter" style={{ color: "var(--text)" }}>
                        ${result.price.toFixed(2)}
                      </span>
                      <span
                        className="text-sm font-semibold px-2.5 py-1 rounded-md"
                        style={{
                          color: result.change >= 0 ? "var(--green)" : "var(--red)",
                          background: result.change >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                        }}
                      >
                        {result.change >= 0 ? "+" : ""}{result.change.toFixed(2)} ({result.changePercent.toFixed(2)}%)
                      </span>
                    </div>

                    {result.dayHigh > 0 && <RangeBar low={result.dayLow} high={result.dayHigh} current={result.price} label="Today" />}
                    {result.yearHigh > 0 && <RangeBar low={result.yearLow} high={result.yearHigh} current={result.price} label="52 Week" />}
                  </div>

                  <div className="flex flex-col items-center flex-shrink-0">
                    <ScoreGauge score={result.finalScore} rating={result.rating} ratingColor={result.ratingColor} size={170} />
                    <div className="mt-2 text-center">
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{totalMetrics} metrics evaluated</div>
                      <div className="flex items-center justify-center gap-3 mt-0.5">
                        <span className="text-[11px] font-semibold" style={{ color: "#10b981" }}>{totalBuy} buy</span>
                        <span className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>{totalSell} sell</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        const btn = document.getElementById("share-btn");
                        if (btn) { btn.textContent = "Copied!"; setTimeout(() => { btn.textContent = "Share Link"; }, 2000); }
                      }}
                      id="share-btn"
                      className="mt-3 text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                      style={{ color: "var(--accent)", border: "1px solid rgba(99,102,241,0.2)", background: "rgba(99,102,241,0.04)" }}
                    >
                      Share Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Market Cap" value={formatNumber(result.marketCap)} />
                <StatCard label="P/E Ratio" value={result.pe ? result.pe.toFixed(2) : "N/A"} />
                <StatCard label="EPS" value={result.eps ? "$" + result.eps.toFixed(2) : "N/A"} />
                <StatCard label="Beta" value={result.beta ? result.beta.toFixed(2) : "N/A"} sub="Volatility" />
                <StatCard label="Volume" value={formatNumber(result.volume)} sub="Today" />
                <StatCard label="Avg Volume" value={formatNumber(result.avgVolume)} />
                <StatCard label="Open" value={result.open ? "$" + result.open.toFixed(2) : "N/A"} />
                <StatCard label="Prev Close" value={result.previousClose ? "$" + result.previousClose.toFixed(2) : "N/A"} />
              </div>

              {/* Description */}
              {result.description && (
                <div className="card rounded-xl p-5">
                  <h3 className="section-label mb-2">About {result.companyName}</h3>
                  <p
                    className={cn("text-[13px] leading-relaxed transition-all", !descExpanded && "line-clamp-3")}
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {result.description}
                  </p>
                  {result.description.length > 200 && (
                    <button onClick={() => setDescExpanded(!descExpanded)} className="text-[12px] font-semibold mt-1.5 cursor-pointer" style={{ color: "var(--accent)" }}>
                      {descExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
              )}

              {/* Verdict */}
              <div
                className="rounded-xl p-5 flex items-center gap-4"
                style={{ background: result.ratingColor + "06", border: `1px solid ${result.ratingColor}18` }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0"
                  style={{ background: result.ratingColor + "12", color: result.ratingColor }}
                >
                  {result.finalScore}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black" style={{ color: result.ratingColor }}>Verdict: {result.rating}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Based on {totalMetrics} metrics across {result.categories.length} categories.
                    {totalBuy > totalSell
                      ? ` ${totalBuy} buy vs ${totalSell} sell signals — positive outlook.`
                      : totalSell > totalBuy
                        ? ` ${totalSell} sell vs ${totalBuy} buy signals — exercise caution.`
                        : " Signals evenly split between buy and sell."}
                  </div>
                </div>
                <div className="text-[10px] font-mono flex-shrink-0 text-right" style={{ color: "var(--text-dim)" }}>
                  {timeAgo(result.evaluatedAt)}
                </div>
              </div>

              {/* Signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SignalCard title="Top Buy Signals" metrics={result.topSignals} color="#10b981" icon="&#9650;" />
                <SignalCard title="Red Flags" metrics={result.redFlags} color="#ef4444" icon="&#9660;" />
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Detailed Breakdown</h2>
                  <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>Click to expand</span>
                </div>
                <div className="space-y-2">
                  {result.categories.map((cat, i) => (
                    <CategoryBar key={i} category={cat} index={i} />
                  ))}
                </div>
              </div>

              {/* Scale */}
              <div className="card rounded-xl p-5">
                <h3 className="section-label mb-3">Scoring Scale</h3>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { range: "75-100", label: "STRONG BUY", color: "#22c55e" },
                    { range: "55-74", label: "BUY", color: "#4ade80" },
                    { range: "35-54", label: "HOLD", color: "#f59e0b" },
                    { range: "15-34", label: "UNDERWEIGHT", color: "#f97316" },
                    { range: "0-14", label: "SELL", color: "#ef4444" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="py-3 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)" }}
                    >
                      <div className="text-[9px] font-black tracking-wide" style={{ color: r.color }}>{r.label}</div>
                      <div className="text-[9px] mt-0.5 font-mono" style={{ color: "var(--text-dim)" }}>{r.range}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
                This analysis is for informational and educational purposes only. It is not financial advice. Past performance does not guarantee future results. Always conduct your own due diligence and consult a licensed financial advisor before making investment decisions.
              </p>
            </div>

            {/* ──── Sidebar ──── */}
            <div className="lg:col-span-1 space-y-4">
              <div className="lg:sticky lg:top-16 space-y-4">
                <div className="card rounded-xl p-4">
                  <h3 className="section-label mb-3">Category Scores</h3>
                  <CategorySummary categories={result.categories} />
                </div>

                <div className="card rounded-xl p-4">
                  <h3 className="section-label mb-2.5">Quick Info</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Exchange", value: result.exchange },
                      { label: "Sector", value: result.sector },
                      { label: "Industry", value: result.industry },
                      { label: "Country", value: result.country },
                    ]
                      .filter((item) => item.value)
                      .map((item) => (
                        <div key={item.label} className="flex justify-between items-center">
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.label}</span>
                          <span className="text-[11px] font-semibold text-right max-w-[55%] truncate" style={{ color: "var(--text-secondary)" }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="card rounded-xl p-4">
                  <h3 className="section-label mb-2.5">Quick Evaluate</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {popular.filter((t) => t !== result.ticker).slice(0, 6).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTicker(t); handleEvaluateDirect(t); }}
                        className="px-2.5 py-1.5 rounded-md text-[11px] font-mono font-semibold cursor-pointer ticker-btn"
                        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Footer ═══════ */}
      <footer className="relative z-10 mt-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="w-full max-w-5xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}
              >
                S
              </div>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-dim)" }}>
                StockGrade &copy; {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-dim)", opacity: 0.5 }}>
              Data provided by Yahoo Finance. Scores are algorithmically generated. Not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
