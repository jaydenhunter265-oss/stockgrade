"use client";

import { useState, useEffect } from "react";
import { timeAgo } from "@/lib/utils";

/* ── Types ── */

interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string;
  thumbnail: string | null;
}

type Sentiment = "bullish" | "neutral" | "bearish";

/* ── Lightweight headline sentiment analysis ── */

const BULLISH_WORDS = [
  "beats", "beat", "surges", "surge", "rises", "rises", "rallies", "rally",
  "profit", "profits", "record", "growth", "grows", "upgrades", "upgrade",
  "outperform", "strong", "buy", "bullish", "positive", "gains", "gain",
  "high", "highs", "expands", "expansion", "launches", "milestone",
  "raises guidance", "raises", "breakthrough", "jumps", "soars", "soar",
  "tops", "exceeds", "exceeding", "best", "boosts", "boost",
];

const BEARISH_WORDS = [
  "misses", "miss", "falls", "fall", "drops", "drop", "slumps", "slump",
  "loss", "losses", "cuts", "cut", "declines", "decline", "downgrades",
  "downgrade", "underperform", "weak", "sell", "bearish", "negative",
  "concern", "concerns", "risks", "risk", "debt", "layoffs", "layoff",
  "bankruptcy", "warning", "warns", "lowers guidance", "lowers",
  "disappoints", "disappointing", "plunges", "plunge", "crash", "crashes",
  "lawsuit", "probe", "investigation", "recall",
];

function analyzeSentiment(title: string): { sentiment: Sentiment; score: number } {
  const lower = title.toLowerCase();
  let score = 0;
  for (const w of BULLISH_WORDS) if (lower.includes(w)) score += 1;
  for (const w of BEARISH_WORDS) if (lower.includes(w)) score -= 1;
  if (score > 0) return { sentiment: "bullish", score };
  if (score < 0) return { sentiment: "bearish", score };
  return { sentiment: "neutral", score: 0 };
}

const SENTIMENT_CONFIG = {
  bullish: { label: "Bullish", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  neutral: { label: "Neutral", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  bearish: { label: "Bearish", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

/* ── News card with sentiment ── */

function SentimentNewsCard({
  article,
  onClick,
}: {
  article: NewsItem;
  onClick: () => void;
}) {
  const { sentiment } = analyzeSentiment(article.title);
  const cfg = SENTIMENT_CONFIG[sentiment];

  return (
    <div
      onClick={onClick}
      className="card news-card rounded-xl overflow-hidden cursor-pointer"
      style={{ position: "relative" }}
    >
      {article.thumbnail && (
        <div className="w-full h-28 overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
          <img
            src={article.thumbnail}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3.5">
        {/* Sentiment badge */}
        <span
          className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}20` }}
        >
          {cfg.label}
        </span>
        <h4 className="text-[12px] font-semibold leading-snug mb-2 line-clamp-2" style={{ color: "var(--text)" }}>
          {article.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-dim)" }}>
          <span className="font-medium" style={{ color: "var(--text-muted)" }}>
            {article.publisher}
          </span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Overall sentiment summary ── */

function OverallSentimentBar({ news }: { news: NewsItem[] }) {
  if (!news.length) return null;

  const counts = { bullish: 0, neutral: 0, bearish: 0 };
  for (const item of news) {
    const { sentiment } = analyzeSentiment(item.title);
    counts[sentiment] += 1;
  }

  const total = news.length;
  const bPct  = Math.round((counts.bullish / total) * 100);
  const nPct  = Math.round((counts.neutral / total) * 100);
  const sPct  = 100 - bPct - nPct;

  const dominantSentiment: Sentiment =
    counts.bullish > counts.bearish
      ? "bullish"
      : counts.bearish > counts.bullish
        ? "bearish"
        : "neutral";

  const cfg = SENTIMENT_CONFIG[dominantSentiment];

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}18` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
            News Sentiment
          </span>
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}22` }}
          >
            {cfg.label}
          </span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          {total} articles
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-2 rounded-full overflow-hidden flex">
        {bPct > 0 && (
          <div className="h-full" style={{ width: `${bPct}%`, background: "#10b981" }} />
        )}
        {nPct > 0 && (
          <div className="h-full" style={{ width: `${nPct}%`, background: "#f59e0b" }} />
        )}
        {sPct > 0 && (
          <div className="h-full" style={{ width: `${sPct}%`, background: "#ef4444" }} />
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
        <span style={{ color: "#10b981" }}>{bPct}% Bullish</span>
        <span style={{ color: "#f59e0b" }}>{nPct}% Neutral</span>
        <span style={{ color: "#ef4444" }}>{sPct}% Bearish</span>
      </div>
    </div>
  );
}

/* ══════════════ Main Component ══════════════ */

export default function SentimentNewsSection({
  ticker,
  onSelectArticle,
}: {
  ticker: string;
  onSelectArticle: (article: NewsItem) => void;
}) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNews([]);
    fetch(`/api/stock-news?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => setNews(d.news ?? []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="card rounded-xl p-5">
        <div className="section-label mb-4">Latest News &amp; Sentiment</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="shimmer rounded-xl h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (!news.length) return null;

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Latest News &amp; Sentiment — {ticker}</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          Yahoo Finance
        </span>
      </div>

      <OverallSentimentBar news={news.slice(0, 6)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {news.slice(0, 6).map((article, i) => (
          <SentimentNewsCard
            key={i}
            article={article}
            onClick={() => onSelectArticle(article)}
          />
        ))}
      </div>
    </div>
  );
}
