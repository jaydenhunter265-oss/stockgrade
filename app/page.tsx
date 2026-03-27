"use client";

import { useState, useRef, useEffect } from "react";
import type { EvaluationResult, CategoryScore, MetricScore, PillarScore } from "@/lib/types";
import { formatNumber, cn, timeAgo } from "@/lib/utils";
import PriceChart from "@/components/price-chart";
import PriceProjPanel from "@/components/price-projection-panel";
import ScoreDrivers from "@/components/score-drivers";
import SentimentNewsSection from "@/components/sentiment-news-section";
import CollapsibleSection from "@/components/collapsible-section";
import HybridForecast from "@/components/hybrid-forecast";

/* ══════════════════ Types ══════════════════ */

interface TopStockItem {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  qualityScore: number;
  growthScore: number;
  valueScore: number;
  combinedScore: number;
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

interface AnalystTargets {
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
  currentPrice: number | null;
  numberOfAnalysts: number | null;
  recommendationKey: string | null;
  recommendationMean: number | null;
}

interface ESGData {
  totalEsg: number | null;
  environmentScore: number | null;
  socialScore: number | null;
  governanceScore: number | null;
  esgPerformance: string | null;
  peerGroup: string | null;
  highestControversy: number | null;
  peerCount: number | null;
  percentile: number | null;
}

interface RecommendationTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

interface EarningsPeriod {
  period: string;
  endDate: string | null;
  growth: number | null;
  earningsEstimate: {
    avg: number | null;
    low: number | null;
    high: number | null;
    numberOfAnalysts: number | null;
    yearAgoEps: number | null;
  };
  revenueEstimate: {
    avg: number | null;
    low: number | null;
    high: number | null;
    numberOfAnalysts: number | null;
    yearAgoRevenue: number | null;
  };
}

interface OwnershipData {
  heldByInsiders: number | null;
  heldByInstitutions: number | null;
  shortPercentOfFloat: number | null;
  sharesShort: number | null;
  shortRatio: number | null;
  floatShares: number | null;
}

interface StockDetails {
  analystTargets: AnalystTargets | null;
  esg: ESGData | null;
  recommendationTrends: RecommendationTrend[];
  earningsEstimates: EarningsPeriod[];
  ownership: OwnershipData | null;
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
  const cls = signal === "buy" ? "signal-buy" : signal === "sell" ? "signal-sell" : "signal-neutral";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {signal}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      className="rounded-lg p-3.5 transition-all duration-150"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
      <div
        className="text-[14px] font-semibold font-mono leading-none"
        style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[9px] mt-1" style={{ color: "var(--text-dim)" }}>
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
      <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>
        <span>${low.toFixed(2)}</span>
        <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span>${high.toFixed(2)}</span>
      </div>
      <div className="relative h-1.5 rounded-full" style={{ background: "var(--border)" }}>
        <div className="absolute h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)" }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2"
          style={{ left: `calc(${pct}% - 5px)`, background: "var(--text)", borderColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}

/* ══════════════════ Analyst Targets Section ══════════════════ */

function AnalystTargetsSection({ targets, currentPrice }: { targets: AnalystTargets; currentPrice: number }) {
  const low = targets.targetLow;
  const mean = targets.targetMean;
  const median = targets.targetMedian;
  const high = targets.targetHigh;

  if (!low || !high || !mean) return null;

  const rangeMin = Math.min(low, currentPrice) * 0.95;
  const rangeMax = high * 1.05;
  const totalRange = rangeMax - rangeMin;

  function pctOf(val: number) {
    return ((val - rangeMin) / totalRange) * 100;
  }

  const upside = mean ? (((mean - currentPrice) / currentPrice) * 100).toFixed(1) : null;
  const recKey = targets.recommendationKey;
  const recColor =
    recKey === "strong_buy" || recKey === "buy"
      ? "#10b981"
      : recKey === "hold"
        ? "#f59e0b"
        : recKey === "sell" || recKey === "strong_sell"
          ? "#ef4444"
          : "var(--text-muted)";

  const recLabel = recKey
    ? recKey
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Analyst Price Targets</div>
        <div className="flex items-center gap-2">
          {targets.numberOfAnalysts && (
            <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>
              {targets.numberOfAnalysts} analyst{targets.numberOfAnalysts > 1 ? "s" : ""}
            </span>
          )}
          {recLabel && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background: recColor + "15", color: recColor }}
            >
              {recLabel}
            </span>
          )}
        </div>
      </div>

      {/* Target bar */}
      <div className="relative mt-6 mb-8">
        {/* Bar background */}
        <div className="h-2 rounded-full relative" style={{ background: "var(--border)" }}>
          {/* Range fill from low to high */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${pctOf(low)}%`,
              width: `${pctOf(high) - pctOf(low)}%`,
              background: "linear-gradient(90deg, rgba(239,68,68,0.3), rgba(245,158,11,0.3), rgba(16,185,129,0.3))",
            }}
          />
        </div>

        {/* Low marker */}
        <div className="absolute" style={{ left: `${pctOf(low)}%`, top: "-6px", transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-5 mx-auto" style={{ background: "#ef4444" }} />
          <div className="text-center mt-1">
            <div className="text-[9px] font-bold" style={{ color: "#ef4444" }}>LOW</div>
            <div className="text-[11px] font-mono font-bold" style={{ color: "var(--text-secondary)" }}>${low.toFixed(0)}</div>
          </div>
        </div>

        {/* Mean marker */}
        {mean && (
          <div className="absolute" style={{ left: `${pctOf(mean)}%`, top: "-6px", transform: "translateX(-50%)" }}>
            <div className="w-0.5 h-5 mx-auto" style={{ background: "#f59e0b" }} />
            <div className="text-center mt-1">
              <div className="text-[9px] font-bold" style={{ color: "#f59e0b" }}>AVG</div>
              <div className="text-[11px] font-mono font-bold" style={{ color: "var(--text-secondary)" }}>${mean.toFixed(0)}</div>
            </div>
          </div>
        )}

        {/* High marker */}
        <div className="absolute" style={{ left: `${pctOf(high)}%`, top: "-6px", transform: "translateX(-50%)" }}>
          <div className="w-0.5 h-5 mx-auto" style={{ background: "#10b981" }} />
          <div className="text-center mt-1">
            <div className="text-[9px] font-bold" style={{ color: "#10b981" }}>HIGH</div>
            <div className="text-[11px] font-mono font-bold" style={{ color: "var(--text-secondary)" }}>${high.toFixed(0)}</div>
          </div>
        </div>

        {/* Current price marker */}
        <div className="absolute" style={{ left: `${pctOf(currentPrice)}%`, top: "-10px", transform: "translateX(-50%)" }}>
          <div
            className="w-4 h-4 rounded-full border-2 mx-auto"
            style={{ background: "var(--accent)", borderColor: "var(--bg)", boxShadow: `0 0 8px rgba(0,191,165,0.5)` }}
          />
          <div className="text-center mt-1">
            <div className="text-[9px] font-bold" style={{ color: "var(--accent)" }}>CURRENT</div>
            <div className="text-[11px] font-mono font-bold" style={{ color: "var(--text)" }}>${currentPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-center">
          <div className="text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>Low Target</div>
          <div className="text-sm font-mono font-bold" style={{ color: "#ef4444" }}>${low.toFixed(2)}</div>
        </div>
        {median && (
          <div className="text-center">
            <div className="text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>Median</div>
            <div className="text-sm font-mono font-bold" style={{ color: "var(--text-secondary)" }}>${median.toFixed(2)}</div>
          </div>
        )}
        <div className="text-center">
          <div className="text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>High Target</div>
          <div className="text-sm font-mono font-bold" style={{ color: "#10b981" }}>${high.toFixed(2)}</div>
        </div>
        {upside && (
          <div className="text-center">
            <div className="text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>Upside</div>
            <div className="text-sm font-mono font-bold" style={{ color: Number(upside) >= 0 ? "#10b981" : "#ef4444" }}>
              {Number(upside) >= 0 ? "+" : ""}
              {upside}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════ ESG Section ══════════════════ */

function ESGSection({ esg }: { esg: ESGData }) {
  if (!esg.totalEsg) return null;

  const score = esg.totalEsg;

  // ESG Risk Rating categories (Sustainalytics style - lower is better)
  function getESGCategory(s: number): { label: string; color: string } {
    if (s < 10) return { label: "Negligible", color: "#10b981" };
    if (s < 20) return { label: "Low", color: "#4ade80" };
    if (s < 30) return { label: "Medium", color: "#f59e0b" };
    if (s < 40) return { label: "High", color: "#f97316" };
    return { label: "Severe", color: "#ef4444" };
  }

  const category = getESGCategory(score);

  // Position on the 0-50 scale bar
  const barPct = Math.min(100, (score / 50) * 100);

  // Controversy level
  const controversyLevel = esg.highestControversy;
  function getControversyLabel(level: number | null): { label: string; color: string } {
    if (level == null) return { label: "N/A", color: "var(--text-dim)" };
    if (level <= 1) return { label: "Low", color: "#10b981" };
    if (level <= 2) return { label: "Moderate", color: "#f59e0b" };
    if (level <= 3) return { label: "Significant", color: "#f97316" };
    if (level <= 4) return { label: "High", color: "#ef4444" };
    return { label: "Severe", color: "#ef4444" };
  }

  const controversy = getControversyLabel(controversyLevel);

  const pillars = [
    { name: "Environment", score: esg.environmentScore, icon: "E" },
    { name: "Social", score: esg.socialScore, icon: "S" },
    { name: "Governance", score: esg.governanceScore, icon: "G" },
  ];

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="section-label">ESG Risk Assessment</div>
        {esg.peerGroup && (
          <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>
            {esg.peerGroup}
          </span>
        )}
      </div>

      {/* Main ESG Risk Rating Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="text-2xl font-black font-mono"
            style={{ color: category.color }}
          >
            {score.toFixed(1)}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: category.color }}>
              {category.label} Risk
            </div>
            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
              ESG Risk Rating
            </div>
          </div>
        </div>

        {/* Gradient bar */}
        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, #10b981 0%, #4ade80 20%, #f59e0b 40%, #f97316 60%, #ef4444 80%, #dc2626 100%)",
              opacity: 0.4,
            }}
          />
          {/* Score marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2"
            style={{
              left: `calc(${barPct}% - 8px)`,
              background: category.color,
              borderColor: "var(--bg)",
              boxShadow: `0 0 8px ${category.color}60`,
            }}
          />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between mt-1.5 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          <span>0 Negligible</span>
          <span>10</span>
          <span>20 Medium</span>
          <span>30</span>
          <span>40+ Severe</span>
        </div>
      </div>

      {/* Pillars + Controversy in grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ESG Pillars */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Pillar Scores
          </div>
          <div className="space-y-2.5">
            {pillars.map((pillar) => {
              if (pillar.score == null) return null;
              const pillarCat = getESGCategory(pillar.score);
              const pillarPct = Math.min(100, (pillar.score / 50) * 100);
              return (
                <div key={pillar.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black"
                        style={{ background: pillarCat.color + "15", color: pillarCat.color }}
                      >
                        {pillar.icon}
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                        {pillar.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-bold" style={{ color: pillarCat.color }}>
                      {pillar.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full metric-bar"
                      style={{ width: `${pillarPct}%`, background: pillarCat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controversy Level */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Controversy Level
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black"
              style={{ background: controversy.color + "12", color: controversy.color }}
            >
              {controversyLevel ?? "?"}
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: controversy.color }}>
                {controversy.label}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                Scale: 1 (Low) to 5 (Severe)
              </div>
            </div>
          </div>

          {/* 5-level indicator */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => {
              const active = controversyLevel != null && level <= controversyLevel;
              const levelColor =
                level <= 1 ? "#10b981" : level <= 2 ? "#f59e0b" : level <= 3 ? "#f97316" : "#ef4444";
              return (
                <div
                  key={level}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    background: active ? levelColor : "var(--border)",
                    opacity: active ? 1 : 0.3,
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[8px] font-mono" style={{ color: "var(--text-dim)" }}>
            <span>Low</span>
            <span>Severe</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Category Components ══════════════════ */

function CategoryBar({ category, index }: { category: CategoryScore; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const barColor = category.percentage >= 65 ? "#10b981" : category.percentage >= 40 ? "#f59e0b" : "#ef4444";
  const barBg =
    category.percentage >= 65
      ? "rgba(16,185,129,0.06)"
      : category.percentage >= 40
        ? "rgba(245,158,11,0.05)"
        : "rgba(239,68,68,0.06)";
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
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: barBg, color: barColor }}
          >
            {category.percentage}
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {category.name}
            </h3>
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
          style={{
            color: "var(--text-muted)",
            transform: expanded ? "rotate(180deg)" : "rotate(0)",
            display: "inline-block",
          }}
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
        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: bgTint, color }}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold" style={{ color }}>{title}</h3>
        <span className="text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded" style={{ background: badgeBg, color }}>
          {metrics.length}
        </span>
      </div>
      <div className="space-y-1">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg text-[13px]" style={{ background: "rgba(255,255,255,0.015)" }}>
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{m.name}</span>
            <span className="font-mono font-semibold" style={{ color }}>
              {typeof m.value === "number" ? m.value.toLocaleString() : m.value}
            </span>
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
            <span className="text-[11px] font-medium w-28 truncate" style={{ color: "var(--text-secondary)" }}>
              {cat.name}
            </span>
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

/* ══════════════════ Score Insights Panel ══════════════════ */

function ScoreInsightsPanel({
  categories,
  score,
  rating,
  ratingColor,
}: {
  categories: CategoryScore[];
  score: number;
  rating: string;
  ratingColor: string;
}) {
  const sorted = [...categories].sort((a, b) => b.percentage - a.percentage);
  const topCategories = sorted.slice(0, 2).filter((c) => c.percentage >= 60);
  const weakCategories = sorted.slice(-2).filter((c) => c.percentage < 45);
  const totalBuy = categories.reduce((s, c) => s + c.metrics.filter((m) => m.score === 1).length, 0);
  const totalSell = categories.reduce((s, c) => s + c.metrics.filter((m) => m.score === -1).length, 0);

  type Insight = { icon: string; color: string; text: string };
  const insights: Insight[] = [];

  if (score >= 75) {
    insights.push({ icon: "★", color: "#22c55e", text: `Outstanding across ${categories.length} categories — institutional-quality fundamentals.` });
  } else if (score >= 55) {
    insights.push({ icon: "↑", color: "#4ade80", text: `Solid fundamentals with more strengths than weaknesses — broadly positive outlook.` });
  } else if (score >= 35) {
    insights.push({ icon: "≈", color: "#f59e0b", text: `Mixed picture — notable strengths coexist with real risks. Proceed with due diligence.` });
  } else {
    insights.push({ icon: "↓", color: "#ef4444", text: `Significant concerns across multiple categories. Caution is strongly advised.` });
  }

  topCategories.forEach((cat) => {
    const buyCount = cat.metrics.filter((m) => m.score === 1).length;
    insights.push({
      icon: "✓",
      color: "#10b981",
      text: `${cat.name} is a standout at ${cat.percentage}% — ${buyCount} buy signal${buyCount !== 1 ? "s" : ""} confirm strength here.`,
    });
  });

  weakCategories.forEach((cat) => {
    const sellCount = cat.metrics.filter((m) => m.score === -1).length;
    if (sellCount > 0) {
      insights.push({
        icon: "!",
        color: "#ef4444",
        text: `${cat.name} scores only ${cat.percentage}% — ${sellCount} red flag${sellCount !== 1 ? "s" : ""} raise concern.`,
      });
    }
  });

  if (totalBuy > 0 || totalSell > 0) {
    if (totalBuy >= totalSell * 2) {
      insights.push({ icon: "→", color: "var(--accent)", text: `Signal distribution is bullish: ${totalBuy} buy vs ${totalSell} sell across all metrics.` });
    } else if (totalSell > totalBuy) {
      insights.push({ icon: "→", color: "#f97316", text: `Signal distribution leans bearish: ${totalSell} sell vs ${totalBuy} buy across all metrics.` });
    }
  }

  if (insights.length === 0) return null;

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="section-label">Score Insights</div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: ratingColor + "12", color: ratingColor }}>
          {rating}
        </span>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2.5 py-2.5 px-3 rounded-lg" style={{ background: insight.color + "08", border: `1px solid ${insight.color}18` }}>
            <span className="text-[11px] font-black flex-shrink-0 w-4 text-center mt-px" style={{ color: insight.color }}>
              {insight.icon}
            </span>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {insight.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════ Half Gauge ══════════════════ */

const GAUGE_R = 42;
const GAUGE_CX = 50;
const GAUGE_CY = 52;
const GAUGE_HALF_CIRC = Math.PI * GAUGE_R;
const GAUGE_ARC = `M ${GAUGE_CX - GAUGE_R} ${GAUGE_CY} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_CX + GAUGE_R} ${GAUGE_CY}`;

function HalfGauge({ label, score, color, sub }: { label: string; score: number; color: string; sub?: string }) {
  const offset = GAUGE_HALF_CIRC * (1 - Math.min(score, 100) / 100);
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: `${color}0d`, border: `1px solid ${color}28` }}>
      <svg viewBox="0 0 100 58" className="w-full">
        <path d={GAUGE_ARC} fill="none" stroke="#1e2030" strokeWidth="7" strokeLinecap="round" />
        <path
          d={GAUGE_ARC} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={GAUGE_HALF_CIRC} strokeDashoffset={offset}
          opacity="0.15" style={{ filter: "blur(3px)" }}
          className="half-gauge-arc"
        />
        <path
          d={GAUGE_ARC} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={GAUGE_HALF_CIRC} strokeDashoffset={offset}
          className="half-gauge-arc"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
        <text x="50" y="40" textAnchor="middle" fill="#e6edf3" fontSize="20" fontWeight="800" fontFamily="var(--font-sans)">
          {score}
        </text>
        <text x="50" y="50" textAnchor="middle" fill="#3d4455" fontSize="6" fontFamily="var(--font-sans)">
          /100
        </text>
      </svg>
      <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color }}>{label}</div>
      {sub && <div className="text-[8px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</div>}
    </div>
  );
}

/* ══════════════════ Four Score Panel ══════════════════ */

function FourScorePanel({
  qualityScore,
  growthScore,
  valueScore,
  combinedScore,
  ratingColor,
  compact = false,
}: {
  qualityScore: number;
  growthScore: number;
  valueScore: number;
  combinedScore: number;
  ratingColor: string;
  compact?: boolean;
}) {
  const scores = [
    { label: "Quality", score: qualityScore, color: "#10b981", sub: "Prof · Debt · FCF" },
    { label: "Growth", score: growthScore, color: "#3b82f6", sub: "Rev · EPS · FCF" },
    { label: "Value", score: valueScore, color: "#a78bfa", sub: "P/E · EV · Yield" },
    { label: "Combined", score: combinedScore, color: ratingColor, sub: "40Q · 30G · 30V" },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {scores.map(({ label, score, color }) => (
          <div
            key={label}
            className="rounded-lg py-2 px-1 text-center"
            style={{ background: color + "0e", border: `1px solid ${color}28` }}
          >
            <div className="text-[18px] font-black font-mono leading-none" style={{ color }}>{score}</div>
            <div className="text-[8px] font-bold uppercase tracking-wider mt-0.5 opacity-70" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {scores.map(({ label, score, color, sub }) => (
        <HalfGauge key={label} label={label} score={score} color={color} sub={sub} />
      ))}
    </div>
  );
}

/* ══════════════════ Price Outlook Card ══════════════════ */

function PriceOutlookCard({
  currentPrice,
  analystTargets,
  beta,
}: {
  currentPrice: number;
  analystTargets: AnalystTargets | null;
  beta: number | null | undefined;
}) {
  const hasAnalyst = !!(analystTargets?.targetLow && analystTargets?.targetMean && analystTargets?.targetHigh);

  let bear: number, base: number, bull: number, max: number;

  if (hasAnalyst) {
    bear = analystTargets!.targetLow!;
    base = analystTargets!.targetMedian ?? analystTargets!.targetMean!;
    bull = analystTargets!.targetHigh!;
    max = bull * 1.08;
  } else {
    const vol = beta ? Math.min(0.28, Math.max(0.07, Math.abs(beta) * 0.1)) : 0.1;
    bear = currentPrice * (1 - vol * 1.2);
    base = currentPrice * (1 + vol * 0.3);
    bull = currentPrice * (1 + vol * 1.1);
    max = currentPrice * (1 + vol * 2.0);
  }

  const minBound = Math.min(bear, currentPrice) * 0.98;
  const maxBound = max * 1.02;
  const span = maxBound - minBound;

  const toPos = (v: number) => Math.min(96, Math.max(4, ((v - minBound) / span) * 100));
  const toPct = (v: number) => ((v - currentPrice) / currentPrice) * 100;

  const scenarios = [
    { key: "bear", label: "Bear",   price: bear, color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.14)" },
    { key: "base", label: "Base",   price: base, color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.14)" },
    { key: "bull", label: "Bull",   price: bull, color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.14)" },
    { key: "max",  label: "Max",    price: max,  color: "#10b981", bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.14)" },
  ];

  const currentPos = toPos(currentPrice);

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Price Outlook</div>
        <span
          className="text-[9px] font-mono px-2 py-0.5 rounded"
          style={{ background: "rgba(255,255,255,0.03)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
        >
          {hasAnalyst ? "Analyst Derived" : "Model Projected"}
        </span>
      </div>

      {/* Scenario tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {scenarios.map((s) => {
          const chg = toPct(s.price);
          return (
            <div key={s.key} className="rounded-xl p-3.5" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>{s.label}</div>
              <div className="text-[15px] font-black font-mono" style={{ color: "var(--text)" }}>
                ${s.price.toFixed(0)}
              </div>
              <div className="text-[11px] font-semibold font-mono mt-0.5" style={{ color: chg < 0 ? "#ef4444" : "#10b981" }}>
                {chg >= 0 ? "+" : ""}{chg.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Range bar */}
      <div className="relative">
        {/* Track */}
        <div className="relative h-2 rounded-full" style={{ background: "var(--border)" }}>
          {/* Colored fill between bear and max */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${toPos(bear)}%`,
              width: `${Math.max(0, toPos(max) - toPos(bear))}%`,
              background: "linear-gradient(90deg, #ef4444, #f59e0b 33%, #4ade80 66%, #10b981)",
              opacity: 0.45,
            }}
          />
          {/* Tick marks for each scenario */}
          {scenarios.map((s) => (
            <div
              key={s.key}
              className="absolute top-0 w-px h-2"
              style={{ left: `${toPos(s.price)}%`, background: s.color }}
            />
          ))}
          {/* Current price marker */}
          <div
            className="absolute -top-1"
            style={{ left: `${currentPos}%`, transform: "translateX(-50%)" }}
          >
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{ background: "var(--accent)", borderColor: "var(--bg)", boxShadow: "0 0 10px rgba(0,191,165,0.55)" }}
            />
          </div>
        </div>

        {/* Axis labels */}
        <div className="flex justify-between mt-4 text-[9px] font-mono">
          <span style={{ color: "#ef4444" }}>Bear ${bear.toFixed(0)}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Current ${currentPrice.toFixed(2)}</span>
          </div>
          <span style={{ color: "#10b981" }}>Max ${max.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ AI Verdict Banner ══════════════════ */

function AIVerdictBanner({
  ticker,
  score,
  totalBuy,
  totalSell,
  totalMetrics,
  categories,
  analystTargets,
  currentPrice,
  ratingColor,
  rating,
}: {
  ticker: string;
  score: number;
  totalBuy: number;
  totalSell: number;
  totalMetrics: number;
  categories: CategoryScore[];
  analystTargets: AnalystTargets | null;
  currentPrice: number;
  ratingColor: string;
  rating: string;
}) {
  const sorted = [...categories].sort((a, b) => b.percentage - a.percentage);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const signalRatio = totalMetrics > 0 ? totalBuy / (totalBuy + totalSell || 1) : 0.5;

  let sentence1 = "";
  if (score >= 75) {
    sentence1 = `${ticker} scores in the top tier with exceptional breadth — ${strongest?.name ?? "fundamentals"} leads across evaluated metrics.`;
  } else if (score >= 55) {
    sentence1 = `${ticker} shows solid fundamentals with ${totalBuy} buy signals outpacing ${totalSell} sell signals; ${strongest?.name ?? "core metrics"} is a clear standout.`;
  } else if (score >= 35) {
    sentence1 = `${ticker} is a mixed picture — ${strongest?.name ?? "select metrics"} is a relative strength while ${weakest?.name ?? "other areas"} remains a risk at ${weakest?.percentage ?? "—"}%.`;
  } else {
    sentence1 = `${ticker} faces real fundamental headwinds with ${totalSell} sell signals across ${categories.length} categories; ${weakest?.name ?? "core metrics"} is the primary concern.`;
  }

  let sentence2 = "";
  if (analystTargets?.targetMean && currentPrice) {
    const upside = ((analystTargets.targetMean - currentPrice) / currentPrice) * 100;
    const recKey = analystTargets.recommendationKey;
    const recLabel = recKey ? recKey.replace(/_/g, " ") : null;
    if (upside > 15) {
      sentence2 = `Analyst consensus is ${recLabel ? `"${recLabel}"` : "positive"} with ${upside.toFixed(0)}% mean upside to the $${analystTargets.targetMean.toFixed(0)} target.`;
    } else if (upside >= 0) {
      sentence2 = `Analysts see ${upside.toFixed(0)}% upside to $${analystTargets.targetMean.toFixed(0)}${recLabel ? ` with a "${recLabel}" consensus` : ""}.`;
    } else {
      sentence2 = `Analysts price a mean target of $${analystTargets.targetMean.toFixed(0)}, implying ${Math.abs(upside).toFixed(0)}% downside from current levels.`;
    }
  } else if (signalRatio >= 0.65) {
    sentence2 = `Quantitative signals strongly favor the bull case — ${Math.round(signalRatio * 100)}% of evaluated metrics are positive.`;
  } else if (signalRatio < 0.4) {
    sentence2 = `The weight of evidence leans bearish — watch for fundamental improvement before adding exposure.`;
  } else {
    sentence2 = `Signals are balanced — a measured, selective approach is prudent until a directional catalyst emerges.`;
  }

  const icon = score >= 75 ? "★" : score >= 55 ? "↑" : score >= 35 ? "≈" : "↓";
  const iconColor = score >= 75 ? "#22c55e" : score >= 55 ? "#4ade80" : score >= 35 ? "#f59e0b" : "#ef4444";

  return (
    <div className="rounded-xl p-4 sm:p-5" style={{ background: ratingColor + "06", border: `1px solid ${ratingColor}18` }}>
      <div className="flex items-start gap-3.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 mt-0.5"
          style={{ background: iconColor + "15", color: iconColor }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: ratingColor }}>
              AI Outlook
            </span>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: ratingColor + "10", color: ratingColor }}
            >
              {rating}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {sentence1}{" "}{sentence2}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ 4-Pillar Score Breakdown ══════════════════ */

function PillarScoreCard({ pillar }: { pillar: PillarScore }) {
  const pct = pillar.maxScore > 0 ? (pillar.score / pillar.maxScore) * 100 : 50;
  const barColor = pct >= 65 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  const pillColors: Record<string, string> = {
    Fundamentals: "#10b981",
    Technical: "#3b82f6",
    Sentiment: "#a78bfa",
    Risk: "#f59e0b",
  };
  const color = pillColors[pillar.name] ?? barColor;

  return (
    <div className="rounded-xl p-4" style={{ background: color + "08", border: `1px solid ${color}18` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color }}>{pillar.name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black font-mono" style={{ color }}>{pillar.score}</span>
          <span className="text-[10px] font-mono opacity-50" style={{ color }}>/{pillar.maxScore}</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full metric-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="space-y-1.5">
        {pillar.bullets.map((bullet, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] mt-0.5 flex-shrink-0" style={{ color: bullet.sentiment === "positive" ? "#10b981" : bullet.sentiment === "negative" ? "#ef4444" : "#f59e0b" }}>
              {bullet.sentiment === "positive" ? "✓" : bullet.sentiment === "negative" ? "✗" : "◆"}
            </span>
            <span className="text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{bullet.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MirofishRatingCard({ result }: { result: EvaluationResult }) {
  const ai = result.aiRating;
  const mf = result.mirofish;
  const cardColor = ai.score >= 78 ? "#10b981" : ai.score >= 58 ? "#f59e0b" : "#ef4444";
  const label = ai.label.replace(/_/g, " ");
  const whenText = "earliestDate" in ai.when
    ? `${ai.when.earliestDate} to ${ai.when.latestDate}`
    : "Not likely within 120 days";

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="section-label">MiroFish AI Rating</div>
          <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>
            Predicts if and when price is likely to move up.
          </div>
        </div>
        <div
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{ background: cardColor + "14", color: cardColor, border: `1px solid ${cardColor}30` }}
        >
          {label}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <StatCard label="AI Rating" value={`${ai.score.toFixed(1)}/100`} />
        <StatCard label="Up Probability" value={`${(ai.upProbability * 100).toFixed(1)}%`} />
        <StatCard label="Will Go Up?" value={ai.willGoUp ? "Yes" : "No"} />
        <StatCard label="When" value={whenText} />
      </div>

      <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {mf.note}
      </div>
      <div className="text-[10px] mt-1.5" style={{ color: "var(--text-dim)" }}>
        Backend: {mf.backendReachable ? "reachable" : "unreachable"} | Graph ID: {mf.graphIdConfigured ? "configured" : "not configured"} | Adjustment: {mf.scoreAdjustment >= 0 ? "+" : ""}{mf.scoreAdjustment}
      </div>
    </div>
  );
}

function FourPillarBreakdown({ result }: { result: EvaluationResult }) {
  const pillars = [result.fundamentalsScore, result.technicalScore, result.sentimentScore, result.riskScore];
  const overallColor = result.overallScore >= 70 ? "#10b981" : result.overallScore >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Score Breakdown</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>Overall</span>
          <span className="text-xl font-black font-mono" style={{ color: overallColor }}>{result.overallScore}</span>
          <span className="text-[10px] font-mono opacity-40" style={{ color: overallColor }}>/100</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pillars.map((p) => (
          <PillarScoreCard key={p.name} pillar={p} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════ Risk & Bear Case ══════════════════ */

function RiskBearCaseSection({ result }: { result: EvaluationResult }) {
  const riskColor = result.riskLevel === "Low" ? "#10b981" : result.riskLevel === "Moderate" ? "#f59e0b" : "#ef4444";

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Risk & Downside Analysis</div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
          style={{ background: riskColor + "12", color: riskColor, border: `1px solid ${riskColor}22` }}
        >
          {result.riskLevel} Risk
        </span>
      </div>

      {/* Risk meter */}
      <div className="mb-5">
        <div className="flex justify-between text-[9px] font-mono mb-1.5" style={{ color: "var(--text-dim)" }}>
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
        </div>
        <div className="relative h-2 rounded-full" style={{ background: "var(--border)" }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #10b981, #f59e0b, #ef4444)", opacity: 0.3 }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2"
            style={{
              left: `calc(${result.riskLevel === "Low" ? 16 : result.riskLevel === "Moderate" ? 50 : 84}% - 6px)`,
              background: riskColor,
              borderColor: "var(--bg)",
              boxShadow: `0 0 8px ${riskColor}60`,
            }}
          />
        </div>
      </div>

      {/* Bear Case */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#ef4444" }}>
          Bear Case — What Could Go Wrong
        </div>
        <div className="space-y-2">
          {result.bearCase.map((bullet, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
              style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.10)" }}
            >
              <span className="text-[10px] font-black mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }}>!</span>
              <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Timestamps Display ══════════════════ */

function TimestampBadge({ result }: { result: EvaluationResult }) {
  const generatedDate = new Date(result.evaluatedAt);
  const dataDate = new Date(result.dataUpdatedAt);
  const formatDate = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px]" style={{ color: "var(--text-dim)" }}>
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />
        <span>Generated: {formatDate(generatedDate)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full" style={{ background: "#3b82f6" }} />
        <span>Data updated: {formatDate(dataDate)}</span>
      </div>
    </div>
  );
}

/* ══════════════════ Insider Trading Panel ══════════════════ */

interface InsiderTrade {
  filingDate: string | null;
  transactionDate: string | null;
  reportingName: string;
  role: string;
  typeOfOwner: string;
  isBuy: boolean;
  securitiesTransacted: number;
  price: number | null;
  value: number;
  securityName: string;
  formType: string;
  link: string | null;
}

interface InsiderSummary {
  buyCount: number;
  sellCount: number;
  buyValue: number;
  sellValue: number;
  sentimentScore: number;
  clusterBuying: boolean;
  recentBuyerCount: number;
}

function fmtVal(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function InsiderTradingPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<{ trades: InsiderTrade[]; summary: InsiderSummary | null; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/insider-trades?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ trades: [], summary: null }))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="card rounded-xl p-5">
        <div className="section-label mb-4">Insider Activity</div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer rounded-lg h-11" />)}
        </div>
      </div>
    );
  }

  if (!data || !data.trades?.length) return null;

  const { trades, summary } = data;
  const sentimentColor = summary
    ? summary.sentimentScore > 60 ? "#10b981" : summary.sentimentScore < 40 ? "#ef4444" : "#f59e0b"
    : "#f59e0b";

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Insider Activity</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>Form 4 · SEC EDGAR</span>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Sentiment */}
          <div className="rounded-xl p-3.5" style={{ background: sentimentColor + "08", border: `1px solid ${sentimentColor}18` }}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: sentimentColor }}>
              Insider Sentiment
            </div>
            <div className="text-2xl font-black font-mono leading-none mb-1" style={{ color: sentimentColor }}>
              {summary.sentimentScore}
            </div>
            <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>
              {summary.sentimentScore > 60 ? "Bullish" : summary.sentimentScore < 40 ? "Bearish" : "Neutral"}
            </div>
            <div className="h-1 rounded-full mt-2" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${summary.sentimentScore}%`, background: sentimentColor }} />
            </div>
          </div>

          {/* Buys */}
          <div className="rounded-xl p-3.5" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#10b981" }}>Buys</div>
            <div className="text-xl font-black font-mono leading-none mb-0.5" style={{ color: "#10b981" }}>
              {summary.buyCount}
            </div>
            <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              {summary.buyValue > 0 ? fmtVal(summary.buyValue) : "—"}
            </div>
          </div>

          {/* Sells */}
          <div className="rounded-xl p-3.5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#ef4444" }}>Sells</div>
            <div className="text-xl font-black font-mono leading-none mb-0.5" style={{ color: "#ef4444" }}>
              {summary.sellCount}
            </div>
            <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
              {summary.sellValue > 0 ? fmtVal(summary.sellValue) : "—"}
            </div>
          </div>
        </div>
      )}

      {/* Cluster buying alert */}
      {summary?.clusterBuying && (
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-[11px]"
          style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.16)" }}
        >
          <span className="font-black" style={{ color: "#10b981" }}>★</span>
          <span className="font-bold" style={{ color: "#10b981" }}>Cluster Buying Detected</span>
          <span style={{ color: "var(--text-secondary)" }}>
            — {summary.recentBuyerCount} insiders purchased within the last 30 days
          </span>
        </div>
      )}

      {/* Trades table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Insider", "Role", "Action", "Shares", "Value", "Date"].map((h, i) => (
                <th
                  key={h}
                  className={`pb-2 font-semibold ${i === 0 ? "text-left" : i <= 1 ? "text-left" : i <= 2 ? "text-center" : "text-right"}`}
                  style={{ color: "var(--text-dim)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 12).map((t, i) => {
              const color = t.isBuy ? "#10b981" : "#ef4444";
              return (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td className="py-2.5 font-semibold" style={{ color: "var(--text)" }}>
                    {t.reportingName}
                  </td>
                  <td className="py-2.5" style={{ color: "var(--text-muted)" }}>
                    {t.role}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                      style={{ background: color + "12", color }}
                    >
                      {t.isBuy ? "Buy" : "Sell"}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                    {t.securitiesTransacted.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold" style={{ color }}>
                    {t.value > 0 ? fmtVal(t.value) : "—"}
                  </td>
                  <td className="py-2.5 text-right" style={{ color: "var(--text-dim)" }}>
                    {t.transactionDate?.slice(0, 10) ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════ SEC Filings Panel ══════════════════ */

interface SECFiling {
  type: string;
  label: string;
  filingDate: string | null;
  reportDate: string | null;
  accessionNumber: string;
  url: string;
  viewerUrl: string;
}

interface FilingEvaluation {
  score: "positive" | "neutral" | "warning" | "negative";
  label: string;
  signals: { positive: string[]; negative: string[]; neutral: string[] };
}

function evaluateFilings(filings: SECFiling[]): FilingEvaluation {
  const pos: string[] = [];
  const neg: string[] = [];
  const neu: string[] = [];

  const restatements = filings.filter((f) => f.type === "10-K/A" || f.type === "10-Q/A");
  const annuals = filings.filter((f) => f.type === "10-K");
  const quarterlies = filings.filter((f) => f.type === "10-Q");
  const eightKs = filings.filter((f) => f.type.startsWith("8-K"));

  // Restatement check
  if (restatements.length === 0) {
    pos.push("No amended filings or restatements detected");
  } else if (restatements.length === 1) {
    neg.push("1 amended filing — potential restatement");
  } else {
    neg.push(`${restatements.length} amended filings — restatements detected`);
  }

  // Annual report timeliness (<= 13 months old)
  if (annuals[0]?.filingDate) {
    const monthsAgo =
      (Date.now() - new Date(annuals[0].filingDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 13) {
      pos.push("Annual report filed within expected timeframe");
    } else {
      neg.push(`Annual report is ${Math.round(monthsAgo)} months old — possibly overdue`);
    }
  }

  // Quarterly cadence: 3+ in last 13 months
  const cutoff13 = new Date();
  cutoff13.setMonth(cutoff13.getMonth() - 13);
  const recentQs = quarterlies.filter((q) => q.filingDate && new Date(q.filingDate) >= cutoff13);
  if (recentQs.length >= 3) {
    pos.push("Consistent quarterly reporting cadence");
  } else if (quarterlies.length > 0) {
    neg.push("Quarterly reporting cadence appears inconsistent");
  }

  // 8-K density in last 90 days
  const cutoff90 = new Date();
  cutoff90.setDate(cutoff90.getDate() - 90);
  const recent8K = eightKs.filter((f) => f.filingDate && new Date(f.filingDate) >= cutoff90);
  if (recent8K.length >= 5) {
    neg.push(`${recent8K.length} material disclosures in 90 days — elevated activity`);
  } else if (recent8K.length >= 1) {
    neu.push(
      `${recent8K.length} recent 8-K${recent8K.length > 1 ? "s" : ""} — active material disclosure`
    );
  }

  // Net scoring
  let net = pos.length - neg.length * 1.5 - (restatements.length >= 2 ? 2 : 0);
  let score: FilingEvaluation["score"];
  let label: string;
  if (net >= 2) {
    score = "positive";
    label = "Strong Compliance";
  } else if (net >= 0) {
    score = "neutral";
    label = "Normal Filing Activity";
  } else if (net >= -2) {
    score = "warning";
    label = "Filing Concerns";
  } else {
    score = "negative";
    label = "Elevated Filing Risk";
  }

  return { score, label, signals: { positive: pos, negative: neg, neutral: neu } };
}

const FILING_COLORS: Record<string, string> = {
  "10-K": "#00BFA5",
  "10-K/A": "#00BFA5",
  "10-Q": "#388BFD",
  "10-Q/A": "#388BFD",
  "8-K": "#FFB800",
  "8-K/A": "#FFB800",
};

function SECFilingsPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<{
    filings: SECFiling[];
    companyName?: string;
    edgarUrl?: string;
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/sec-filings?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ filings: [] }))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="card rounded-xl p-5">
        <div className="section-label mb-4">SEC Filings</div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="shimmer rounded-lg h-10" />)}
        </div>
      </div>
    );
  }

  if (!data || !data.filings?.length) return null;

  const annuals = data.filings.filter((f) => f.type.startsWith("10-K"));
  const quarterlies = data.filings.filter((f) => f.type.startsWith("10-Q"));
  const eightK = data.filings.filter((f) => f.type.startsWith("8-K"));
  const evaluation = evaluateFilings(data.filings);

  const evalColors = {
    positive: { bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", text: "#22c55e", dot: "#22c55e" },
    neutral:  { bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.2)", text: "#a1a1aa", dot: "#a1a1aa" },
    warning:  { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#f59e0b", dot: "#f59e0b" },
    negative: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#ef4444", dot: "#ef4444" },
  }[evaluation.score];

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">SEC Filings</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>via EDGAR</span>
          {data.edgarUrl && (
            <a
              href={data.edgarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-bold px-2 py-0.5 rounded transition-all hover:brightness-110"
              style={{ background: "rgba(0,191,165,0.08)", color: "var(--accent)", border: "1px solid rgba(0,191,165,0.15)" }}
            >
              All Filings ↗
            </a>
          )}
        </div>
      </div>

      {/* Filing Evaluation */}
      <div
        className="rounded-lg px-4 py-3 mb-4"
        style={{ background: evalColors.bg, border: `1px solid ${evalColors.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: evalColors.dot }} />
          <span className="text-[11px] font-bold" style={{ color: evalColors.text }}>
            {evaluation.label}
          </span>
          <span className="text-[9px] ml-auto" style={{ color: "var(--text-dim)" }}>
            Pattern analysis
          </span>
        </div>
        <div className="space-y-1">
          {evaluation.signals.positive.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-px" style={{ color: "#22c55e" }}>✓</span>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{s}</span>
            </div>
          ))}
          {evaluation.signals.neutral.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-px" style={{ color: "#f59e0b" }}>◆</span>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{s}</span>
            </div>
          ))}
          {evaluation.signals.negative.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-px" style={{ color: "#ef4444" }}>✗</span>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[9px]">
        {[["10-K", "#00BFA5", "Annual"], ["10-Q", "#388BFD", "Quarterly"], ["8-K", "#FFB800", "Current"]].map(([type, color, desc]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span style={{ color: "var(--text-dim)" }}>{type} <span className="opacity-60">({desc})</span></span>
          </div>
        ))}
      </div>

      {/* Quick stats row */}
      {(annuals.length > 0 || quarterlies.length > 0) && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {annuals[0] && (
            <div className="text-[10px]">
              <span style={{ color: "var(--text-dim)" }}>Latest 10-K: </span>
              <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{annuals[0].filingDate?.slice(0, 10)}</span>
            </div>
          )}
          {quarterlies[0] && (
            <div className="text-[10px]">
              <span style={{ color: "var(--text-dim)" }}>Latest 10-Q: </span>
              <span className="font-mono font-semibold" style={{ color: "#3b82f6" }}>{quarterlies[0].filingDate?.slice(0, 10)}</span>
            </div>
          )}
          {eightK.length > 0 && (
            <div className="text-[10px]">
              <span style={{ color: "var(--text-dim)" }}>8-K filings (recent): </span>
              <span className="font-mono font-semibold" style={{ color: "#f59e0b" }}>{eightK.length}</span>
            </div>
          )}
        </div>
      )}

      {/* Filing list */}
      <div className="space-y-1.5">
        {data.filings.slice(0, 12).map((f, i) => {
          const color = FILING_COLORS[f.type] ?? "#71717a";
          return (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-all hover:bg-white/5 group"
              style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0 text-center min-w-[3rem]"
                  style={{ background: color + "12", color }}
                >
                  {f.type}
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                    {f.label}
                  </div>
                  {f.reportDate && (
                    <div className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
                      Period: {f.reportDate.slice(0, 10)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {f.filingDate?.slice(0, 10)}
                </span>
                <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-muted)" }}>
                  ↗
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════ Institutional Holdings Panel ══════════════════ */

interface InstHolder {
  organization: string;
  pctHeld: number | null;
  position: number | null;
  value: number | null;
  pctChange: number | null;
  reportDate: string | null;
}

interface InstSummary {
  pctHeldByInsiders: number | null;
  pctHeldByInstitutions: number | null;
  pctHeldByFloatInstitutions: number | null;
  institutionCount: number | null;
}

function InstitutionalHoldingsPanel({ ticker }: { ticker: string }) {
  const [data, setData] = useState<{
    summary: InstSummary | null;
    holders: InstHolder[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/institutional-holdings?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ summary: null, holders: [] }))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="card rounded-xl p-5">
        <div className="section-label mb-4">Institutional Holdings</div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer rounded-lg h-10" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || (!data.summary && !data.holders?.length)) return null;

  const { summary, holders } = data;

  // Net institutional sentiment: are top holders accumulating or distributing?
  const changers = holders.filter((h) => h.pctChange !== null);
  const netBuyers = changers.filter((h) => (h.pctChange ?? 0) > 0).length;
  const netSellers = changers.filter((h) => (h.pctChange ?? 0) < 0).length;
  const netSentiment =
    changers.length === 0
      ? "neutral"
      : netBuyers > netSellers
      ? "accumulating"
      : netSellers > netBuyers
      ? "distributing"
      : "mixed";

  const sentimentStyle = {
    accumulating: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", label: "Net Accumulating" },
    distributing:  { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", label: "Net Distributing" },
    mixed:         { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Mixed Activity" },
    neutral:       { color: "#a1a1aa", bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.2)", label: "No Change Data" },
  }[netSentiment];

  const fmtPct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(2)}%`);
  const fmtShares = (v: number | null) => {
    if (v == null) return "—";
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return `${v}`;
  };

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Institutional Holdings</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          via Yahoo Finance
        </span>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Institutional", value: fmtPct(summary.pctHeldByInstitutions), color: "var(--accent)" },
            { label: "Insider", value: fmtPct(summary.pctHeldByInsiders), color: "#3b82f6" },
            { label: "Inst. of Float", value: fmtPct(summary.pctHeldByFloatInstitutions), color: "#8b5cf6" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-lg p-3 text-center"
              style={{ background: tile.color + "0d", border: `1px solid ${tile.color}20` }}
            >
              <div className="text-[15px] font-black" style={{ color: tile.color }}>
                {tile.value}
              </div>
              <div className="text-[9px] font-medium mt-0.5" style={{ color: "var(--text-dim)" }}>
                {tile.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Net sentiment badge */}
      {changers.length > 0 && (
        <div
          className="rounded-lg px-3 py-2 mb-4 flex items-center gap-3"
          style={{ background: sentimentStyle.bg, border: `1px solid ${sentimentStyle.border}` }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sentimentStyle.color }} />
          <span className="text-[11px] font-bold" style={{ color: sentimentStyle.color }}>
            {sentimentStyle.label}
          </span>
          <span className="text-[10px] ml-auto" style={{ color: "var(--text-dim)" }}>
            {netBuyers} adding · {netSellers} reducing
          </span>
        </div>
      )}

      {/* Top holders table */}
      {holders.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[10px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "var(--text-dim)" }}>
                <th className="text-left py-1.5 px-2 font-semibold">Institution</th>
                <th className="text-right py-1.5 px-2 font-semibold">Shares</th>
                <th className="text-right py-1.5 px-2 font-semibold">% Held</th>
                <th className="text-right py-1.5 px-2 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {holders.slice(0, 10).map((h, i) => {
                const changeColor =
                  h.pctChange == null
                    ? "var(--text-dim)"
                    : h.pctChange > 0
                    ? "#22c55e"
                    : h.pctChange < 0
                    ? "#ef4444"
                    : "var(--text-dim)";
                const changeLabel =
                  h.pctChange == null
                    ? "—"
                    : h.pctChange > 0
                    ? `+${(h.pctChange * 100).toFixed(2)}%`
                    : `${(h.pctChange * 100).toFixed(2)}%`;
                return (
                  <tr
                    key={i}
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid var(--border)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)",
                    }}
                  >
                    <td className="py-2 px-2 font-medium truncate max-w-[160px]" style={{ color: "var(--text-secondary)" }}>
                      {h.organization}
                    </td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: "var(--text-muted)" }}>
                      {fmtShares(h.position)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                      {fmtPct(h.pctHeld)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold" style={{ color: changeColor }}>
                      {changeLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {summary?.institutionCount != null && (
        <div className="text-[9px] mt-3" style={{ color: "var(--text-dim)" }}>
          {summary.institutionCount.toLocaleString()} institutions reporting
        </div>
      )}
    </div>
  );
}

/* ══════════════════ Stock News Section ══════════════════ */

function StockNewsSection({
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
        <div className="section-label mb-4">Latest News</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="shimmer rounded-xl h-36" />)}
        </div>
      </div>
    );
  }

  if (!news.length) return null;

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Latest News — {ticker}</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>Yahoo Finance</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {news.slice(0, 6).map((article, i) => (
          <NewsCard key={i} article={article} onClick={() => onSelectArticle(article)} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════ Market Pulse Strip ══════════════════ */

function MarketPulseStrip({
  topStocks,
  onEvaluate,
}: {
  topStocks: { topBuy: TopStockItem[]; topSell: TopStockItem[]; all?: TopStockItem[] } | null;
  onEvaluate: (ticker: string) => void;
}) {
  if (!topStocks) return null;
  const pool = topStocks.all ?? [...topStocks.topBuy, ...topStocks.topSell];
  const movers = [...pool].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 6);
  if (movers.length === 0) return null;

  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          Market Movers
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {movers.map((stock) => (
          <button
            key={stock.ticker}
            onClick={() => onEvaluate(stock.ticker)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {stock.image && (
              <img
                src={stock.image}
                alt=""
                className="w-4 h-4 rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span className="text-[12px] font-mono font-bold" style={{ color: "var(--text)" }}>
              {stock.ticker}
            </span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: stock.changePercent >= 0 ? "#10b981" : "#ef4444" }}>
              {stock.changePercent >= 0 ? "+" : ""}
              {stock.changePercent.toFixed(2)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════ Technical Indicators ══════════════════ */

interface TechData {
  ticker: string;
  rsi: number | null;
  rsiSignal: "overbought" | "oversold" | "neutral";
  rsiHistory: { date: string; value: number }[];
  macd: { macd: number; signal: number; hist: number } | null;
  macdSignal: "bullish" | "bearish" | "neutral";
  macdHistory: { date: string; macd: number; signal: number; hist: number }[];
  error?: string;
}

function RSIGauge({ value }: { value: number }) {
  // Clamp to 0-100
  const pct = Math.min(100, Math.max(0, value));
  const color = value > 70 ? "#ef4444" : value < 30 ? "#10b981" : "#f59e0b";
  const label = value > 70 ? "Overbought" : value < 30 ? "Oversold" : "Neutral";

  // Arc parameters
  const cx = 60, cy = 55, r = 44;
  const startAngle = 200, endAngle = 340; // degrees, sweeping 140°
  const sweep = endAngle - startAngle;
  const angle = startAngle + (pct / 100) * sweep;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcX = (deg: number) => cx + r * Math.cos(toRad(deg));
  const arcY = (deg: number) => cy + r * Math.sin(toRad(deg));

  // Background arc path
  const bgPath = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 0 1 ${arcX(endAngle)} ${arcY(endAngle)}`;
  // Value arc path (large-arc-flag = 0 if sweep < 180, else 1)
  const valueSweep = (pct / 100) * sweep;
  const largeArc = valueSweep > 180 ? 1 : 0;
  const valuePath = pct > 0
    ? `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${arcX(angle)} ${arcY(angle)}`
    : null;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="80" viewBox="0 0 120 80">
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" strokeLinecap="round" />
        {/* Zone bands */}
        {/* Oversold zone (0-30) */}
        {(() => {
          const endA = startAngle + (30 / 100) * sweep;
          const p = `M ${arcX(startAngle)} ${arcY(startAngle)} A ${r} ${r} 0 0 1 ${arcX(endA)} ${arcY(endA)}`;
          return <path d={p} fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="8" strokeLinecap="round" />;
        })()}
        {/* Overbought zone (70-100) */}
        {(() => {
          const startA = startAngle + (70 / 100) * sweep;
          const p = `M ${arcX(startA)} ${arcY(startA)} A ${r} ${r} 0 0 1 ${arcX(endAngle)} ${arcY(endAngle)}`;
          return <path d={p} fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="8" strokeLinecap="round" />;
        })()}
        {/* Value arc */}
        {valuePath && (
          <path d={valuePath} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        )}
        {/* Needle dot */}
        <circle cx={arcX(angle)} cy={arcY(angle)} r="4" fill={color} />
        {/* Center value */}
        <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="monospace">
          {value.toFixed(1)}
        </text>
      </svg>
      <div className="text-[10px] font-bold mt-0 -mt-1" style={{ color }}>{label}</div>
      <div className="text-[9px] mt-0.5" style={{ color: "var(--text-dim)" }}>RSI (14)</div>
    </div>
  );
}

function MACDDisplay({ macd }: { macd: { macd: number; signal: number; hist: number }; signal: "bullish" | "bearish" | "neutral" }) {
  const histColor = macd.hist >= 0 ? "#10b981" : "#ef4444";
  const isBullish = macd.macd > macd.signal;
  const crossLabel = isBullish ? "Bullish crossover" : "Bearish crossover";
  const crossColor = isBullish ? "#10b981" : "#ef4444";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-dim)" }}>MACD</div>
          <div className="text-[13px] font-black font-mono" style={{ color: macd.macd >= 0 ? "#10b981" : "#ef4444" }}>
            {macd.macd.toFixed(3)}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-dim)" }}>Signal</div>
          <div className="text-[13px] font-black font-mono" style={{ color: "var(--text-secondary)" }}>
            {macd.signal.toFixed(3)}
          </div>
        </div>
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-dim)" }}>Hist</div>
          <div className="text-[13px] font-black font-mono" style={{ color: histColor }}>
            {macd.hist >= 0 ? "+" : ""}{macd.hist.toFixed(3)}
          </div>
        </div>
      </div>
      <div
        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg text-center"
        style={{ background: crossColor + "10", color: crossColor, border: `1px solid ${crossColor}20` }}
      >
        {crossLabel}
      </div>
    </div>
  );
}

function TechnicalIndicators({ ticker }: { ticker: string }) {
  const [data, setData] = useState<TechData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/technicals?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="card rounded-xl p-5">
        <div className="section-label mb-4">Technical Indicators</div>
        <div className="grid grid-cols-2 gap-4">
          <div className="shimmer rounded-xl h-28" />
          <div className="shimmer rounded-xl h-28" />
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return null; // Fail silently — rate limits are expected on free tier
  }

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Technical Indicators</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          Alpha Vantage · cached 24h
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* RSI */}
        {data.rsi !== null && (
          <div>
            <RSIGauge value={data.rsi} />
            <div className="mt-3 flex justify-between text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
              <span>30 Oversold</span>
              <span>70 Overbought</span>
            </div>
          </div>
        )}

        {/* MACD */}
        {data.macd && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
              MACD (12, 26, 9)
            </div>
            <MACDDisplay macd={data.macd} signal={data.macdSignal} />
          </div>
        )}
      </div>

      {/* Interpretation */}
      {data.rsi !== null && data.macd && (
        <div
          className="mt-4 pt-4 text-[11px] leading-relaxed"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          {data.rsiSignal === "overbought" && data.macdSignal === "bearish" && (
            <span style={{ color: "#ef4444" }}>⚠ RSI overbought + MACD bearish — potential reversal risk.</span>
          )}
          {data.rsiSignal === "oversold" && data.macdSignal === "bullish" && (
            <span style={{ color: "#10b981" }}>✓ RSI oversold + MACD bullish crossover — potential bounce setup.</span>
          )}
          {data.rsiSignal === "neutral" && data.macdSignal === "bullish" && (
            <span style={{ color: "#10b981" }}>MACD bullish crossover with RSI in neutral zone — momentum building.</span>
          )}
          {data.rsiSignal === "neutral" && data.macdSignal === "bearish" && (
            <span style={{ color: "#f97316" }}>MACD bearish — watch for further weakness while RSI has room to fall.</span>
          )}
          {(data.rsiSignal === "neutral" && data.macdSignal === "neutral") && (
            <span style={{ color: "var(--text-muted)" }}>Technicals are neutral — no strong directional signal at this time.</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════ Price Outlook ══════════════════ */

function PriceOutlook({
  earningsEstimates,
  recommendationTrends,
  ownership,
  currentPrice,
  analystTargets,
}: {
  earningsEstimates: EarningsPeriod[];
  recommendationTrends: RecommendationTrend[];
  ownership: OwnershipData | null;
  currentPrice: number;
  analystTargets: AnalystTargets | null;
}) {
  const hasEarnings = earningsEstimates.some((e) => e.earningsEstimate.avg !== null || e.revenueEstimate.avg !== null);
  const hasRec = recommendationTrends.length > 0;
  const hasOwnership = ownership && (ownership.heldByInsiders !== null || ownership.heldByInstitutions !== null || ownership.shortPercentOfFloat !== null);

  if (!hasEarnings && !hasRec && !hasOwnership) return null;

  function periodLabel(period: string): string {
    switch (period) {
      case "0q": return "Current Qtr";
      case "+1q": return "Next Qtr";
      case "0y": return "Current Year";
      case "+1y": return "Next Year";
      default: return period;
    }
  }

  // Most recent recommendation trend
  const latestRec = recommendationTrends[0];
  const totalRec = latestRec ? latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell : 0;

  return (
    <div className="card rounded-xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="section-label">Price Outlook & Research</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>Yahoo Finance</span>
      </div>

      {/* Analyst Recommendation Distribution */}
      {hasRec && latestRec && totalRec > 0 && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Analyst Recommendations ({totalRec} analysts)
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Strong Buy", count: latestRec.strongBuy, color: "#10b981" },
              { label: "Buy", count: latestRec.buy, color: "#4ade80" },
              { label: "Hold", count: latestRec.hold, color: "#f59e0b" },
              { label: "Sell", count: latestRec.sell, color: "#f97316" },
              { label: "Strong Sell", count: latestRec.strongSell, color: "#ef4444" },
            ].map(({ label, count, color }) => {
              const pct = totalRec > 0 ? (count / totalRec) * 100 : 0;
              if (count === 0) return null;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[10px] font-medium w-20 flex-shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[10px] font-mono font-bold w-6 text-right flex-shrink-0" style={{ color }}>{count}</span>
                </div>
              );
            })}
          </div>

          {/* Upside/downside from analyst mean */}
          {analystTargets?.targetMean && (
            <div className="mt-3 flex items-center gap-4 text-[11px]">
              <span style={{ color: "var(--text-dim)" }}>Mean target:</span>
              <span className="font-mono font-bold" style={{ color: "var(--text-secondary)" }}>${analystTargets.targetMean.toFixed(2)}</span>
              {(() => {
                const upside = ((analystTargets.targetMean - currentPrice) / currentPrice) * 100;
                return (
                  <span className="font-mono font-bold" style={{ color: upside >= 0 ? "#10b981" : "#ef4444" }}>
                    {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% from current
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Earnings Estimates */}
      {hasEarnings && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            EPS & Revenue Estimates
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left pb-2 font-semibold" style={{ color: "var(--text-dim)" }}>Period</th>
                  <th className="text-right pb-2 font-semibold" style={{ color: "var(--text-dim)" }}>EPS Est.</th>
                  <th className="text-right pb-2 font-semibold" style={{ color: "var(--text-dim)" }}>Year Ago</th>
                  <th className="text-right pb-2 font-semibold" style={{ color: "var(--text-dim)" }}>YoY Growth</th>
                  <th className="text-right pb-2 font-semibold" style={{ color: "var(--text-dim)" }}>Revenue Est.</th>
                  <th className="text-right pb-2 font-semibold" style={{ color: "var(--text-dim)" }}>Analysts</th>
                </tr>
              </thead>
              <tbody>
                {earningsEstimates.map((ep, i) => {
                  const eps = ep.earningsEstimate;
                  const rev = ep.revenueEstimate;
                  if (eps.avg === null && rev.avg === null) return null;
                  const growth = ep.growth ?? (eps.avg !== null && eps.yearAgoEps !== null && eps.yearAgoEps !== 0
                    ? ((eps.avg - eps.yearAgoEps) / Math.abs(eps.yearAgoEps))
                    : null);
                  const growthPositive = growth !== null && growth >= 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-2.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                        {periodLabel(ep.period)}
                        {ep.endDate && (
                          <span className="block text-[9px] font-normal" style={{ color: "var(--text-dim)" }}>
                            ends {ep.endDate.slice(0, 7)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold" style={{ color: "var(--text)" }}>
                        {eps.avg !== null ? (eps.avg >= 0 ? "$" : "-$") + Math.abs(eps.avg).toFixed(2) : "—"}
                        {eps.avg !== null && eps.low !== null && eps.high !== null && (
                          <span className="block text-[9px] font-normal" style={{ color: "var(--text-dim)" }}>
                            ${eps.low.toFixed(2)} – ${eps.high.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono" style={{ color: "var(--text-muted)" }}>
                        {eps.yearAgoEps !== null ? (eps.yearAgoEps >= 0 ? "$" : "-$") + Math.abs(eps.yearAgoEps).toFixed(2) : "—"}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold" style={{ color: growth === null ? "var(--text-dim)" : growthPositive ? "#10b981" : "#ef4444" }}>
                        {growth !== null ? `${growthPositive ? "+" : ""}${(growth * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                        {rev.avg !== null ? (rev.avg >= 1e9 ? `$${(rev.avg / 1e9).toFixed(1)}B` : `$${(rev.avg / 1e6).toFixed(0)}M`) : "—"}
                      </td>
                      <td className="py-2.5 text-right" style={{ color: "var(--text-dim)" }}>
                        {eps.numberOfAnalysts ?? rev.numberOfAnalysts ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ownership & Short Interest */}
      {hasOwnership && (
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>
            Ownership & Short Interest
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ownership!.heldByInsiders !== null && (
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Insider Held</div>
                <div className="text-base font-black font-mono" style={{ color: ownership!.heldByInsiders > 0.15 ? "#10b981" : "var(--text)" }}>
                  {(ownership!.heldByInsiders * 100).toFixed(2)}%
                </div>
                <div className="h-1 rounded-full mt-1.5" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ownership!.heldByInsiders * 100 * 3)}%`, background: "#10b981" }} />
                </div>
              </div>
            )}
            {ownership!.heldByInstitutions !== null && (
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Institutional</div>
                <div className="text-base font-black font-mono" style={{ color: ownership!.heldByInstitutions > 0.5 ? "var(--accent)" : "var(--text)" }}>
                  {(ownership!.heldByInstitutions * 100).toFixed(1)}%
                </div>
                <div className="h-1 rounded-full mt-1.5" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ownership!.heldByInstitutions * 100)}%`, background: "var(--accent)" }} />
                </div>
              </div>
            )}
            {ownership!.shortPercentOfFloat !== null && (
              <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Short Float</div>
                <div className="text-base font-black font-mono" style={{ color: ownership!.shortPercentOfFloat > 0.1 ? "#ef4444" : ownership!.shortPercentOfFloat > 0.05 ? "#f59e0b" : "var(--text)" }}>
                  {(ownership!.shortPercentOfFloat * 100).toFixed(2)}%
                </div>
                {ownership!.shortRatio !== null && (
                  <div className="text-[9px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                    {ownership!.shortRatio.toFixed(1)}d to cover
                  </div>
                )}
                <div className="h-1 rounded-full mt-1.5" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ownership!.shortPercentOfFloat * 500)}%`, background: ownership!.shortPercentOfFloat > 0.1 ? "#ef4444" : "#f59e0b" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════ News Modal ══════════════════ */

function NewsModal({ article, onClose }: { article: NewsItem; onClose: () => void }) {
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    setContentLoading(true);
    setFetchFailed(false);
    fetch(`/api/article?url=${encodeURIComponent(article.link)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.content) {
          setArticleContent(data.content);
        } else {
          setFetchFailed(true);
        }
      })
      .catch(() => setFetchFailed(true))
      .finally(() => setContentLoading(false));
  }, [article.link]);

  return (
    <div className="news-modal-overlay" onClick={onClose}>
      <div className="news-modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer z-10 transition-colors hover:bg-white/10"
          style={{ background: "rgba(0,0,0,0.5)", color: "var(--text-muted)" }}
        >
          &#10005;
        </button>

        {/* Thumbnail */}
        {article.thumbnail && (
          <div className="w-full h-48 sm:h-64 overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
            <img src={article.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md" style={{ background: "var(--accent)" + "15", color: "var(--accent)" }}>
              {article.publisher}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
              {timeAgo(article.publishedAt)}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-tight mb-6" style={{ color: "var(--text)" }}>
            {article.title}
          </h2>

          {/* Article content */}
          <div
            className="rounded-xl p-5 sm:p-6 mb-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {contentLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
                <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>Loading article...</span>
              </div>
            ) : articleContent ? (
              <div className="space-y-4">
                {articleContent.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-[13px] sm:text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>
                  {fetchFailed ? "Unable to load article content" : "No content available"}
                </div>
                <p className="text-[12px] mb-4" style={{ color: "var(--text-dim)" }}>
                  This article&apos;s content couldn&apos;t be loaded inline. You can read it on the original site.
                </p>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:brightness-110"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  Read on {article.publisher} &#8599;
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-white/5"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              &#8592; Back
            </button>
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors hover:brightness-110"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Open Original &#8599;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Should You Buy Now Box ══════════════════ */

function ShouldYouBuyNowBox({
  result,
  totalBuy,
  totalSell,
  totalMetrics,
  analystTargets,
}: {
  result: EvaluationResult;
  totalBuy: number;
  totalSell: number;
  totalMetrics: number;
  analystTargets: AnalystTargets | null;
}) {
  const score = result.combinedScore;
  const signalRatio = totalBuy + totalSell > 0 ? totalBuy / (totalBuy + totalSell) : 0.5;
  const metricBonus = totalMetrics >= 25 ? 8 : totalMetrics >= 15 ? 4 : 0;
  const rawConfidence = score * 0.45 + signalRatio * 45 + metricBonus;
  const confidence = Math.round(Math.min(95, Math.max(42, rawConfidence)));

  let verdict: "BUY" | "HOLD" | "AVOID";
  let verdictColor: string;
  let verdictBg: string;
  let keyReason: string;

  if (score >= 55) {
    verdict = "BUY";
    verdictColor = "#10b981";
    verdictBg = "rgba(16,185,129,0.07)";
    if (analystTargets?.targetMean && analystTargets.targetMean > result.price) {
      const upside = (((analystTargets.targetMean - result.price) / result.price) * 100).toFixed(0);
      keyReason = `Analyst consensus targets $${analystTargets.targetMean.toFixed(0)} — ${upside}% upside. ${totalBuy} buy signals support the bull case.`;
    } else {
      keyReason = `${totalBuy} buy signals across ${result.categories.length} categories confirm strength. ${result.riskLevel} risk profile supports position.`;
    }
  } else if (score >= 35) {
    verdict = "HOLD";
    verdictColor = "#f59e0b";
    verdictBg = "rgba(245,158,11,0.07)";
    keyReason = `Signals are mixed — ${totalBuy} buy vs ${totalSell} sell across ${result.categories.length} categories. Wait for a clearer directional catalyst.`;
  } else {
    verdict = "AVOID";
    verdictColor = "#ef4444";
    verdictBg = "rgba(239,68,68,0.07)";
    keyReason = `${totalSell} red flags detected across ${result.categories.length} categories. ${result.riskLevel} risk rating warrants caution before entering.`;
  }

  const segments = 10;
  const filledCount = Math.round((confidence / 100) * segments);

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: verdictBg, border: `2px solid ${verdictColor}28` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: verdictColor }} />
        <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: verdictColor }}>
          Should You Buy Now?
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        {/* Verdict */}
        <div className="flex-shrink-0">
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Verdict</div>
          <div className="text-[32px] font-black leading-none" style={{ color: verdictColor, letterSpacing: "-0.04em" }}>
            {verdict}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-14" style={{ background: verdictColor + "22" }} />

        {/* Confidence */}
        <div className="flex-shrink-0">
          <div className="text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-dim)" }}>Confidence</div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-[28px] font-black font-mono leading-none" style={{ color: "var(--text)", letterSpacing: "-0.04em" }}>
              {confidence}
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>%</span>
          </div>
        </div>

        {/* Confidence bar segments */}
        <div className="flex-1 hidden sm:flex flex-col gap-1.5">
          <div className="flex gap-0.5 h-7">
            {Array.from({ length: segments }, (_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  background: i < filledCount ? verdictColor : verdictColor + "15",
                  opacity: i < filledCount ? 0.5 + (i / segments) * 0.5 : 1,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[8px] font-mono" style={{ color: "var(--text-dim)" }}>
            <span>Low conviction</span>
            <span>High conviction</span>
          </div>
        </div>
      </div>

      {/* Key reason */}
      <div
        className="rounded-lg px-3.5 py-2.5"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-[9px] font-bold uppercase tracking-wider mr-2" style={{ color: verdictColor }}>
          Key Reason
        </span>
        <span className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {keyReason}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════ Projection Chart ══════════════════ */

function ProjectionChart({ result }: { result: EvaluationResult }) {
  const { price, yearHigh, yearLow, beta, combinedScore, change } = result;

  const vol = beta ? Math.min(0.40, Math.max(0.06, Math.abs(beta) * 0.13)) : 0.13;
  const trendBias = (combinedScore - 50) / 200;

  // Deterministic pseudo-random using price + yearHigh as seed
  function pseudoRand(i: number): number {
    const s = Math.sin(i * 127.1 + (yearHigh || price) * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  // Build 60 historical points walking backward from current price
  const histPoints: number[] = [];
  {
    const clampLow = (yearLow > 0 ? yearLow : price * 0.6) * 0.88;
    const clampHigh = (yearHigh > 0 ? yearHigh : price * 1.4) * 1.12;
    let p = price;
    for (let i = 0; i < 60; i++) {
      histPoints.unshift(p);
      const r = pseudoRand(i + 1) * 2 - 1;
      const dailyVol = vol / Math.sqrt(252);
      p = Math.max(clampLow, Math.min(clampHigh, p - r * dailyVol * p - trendBias * p));
    }
    histPoints[histPoints.length - 1] = price;
  }

  // Build 30-day forward projection
  interface ProjPoint { x: number; mid: number; low: number; high: number }
  const projPoints: ProjPoint[] = [];
  for (let i = 1; i <= 30; i++) {
    const mid = price * (1 + trendBias * i);
    const spread = price * vol * Math.sqrt(i / 252) * 1.96;
    projPoints.push({ x: 59 + i, mid, low: Math.max(price * 0.4, mid - spread), high: mid + spread });
  }

  const W = 100, H = 70;
  const allValues = [...histPoints, ...projPoints.flatMap((p) => [p.low, p.high])];
  const minVal = Math.min(...allValues) * 0.985;
  const maxVal = Math.max(...allValues) * 1.015;
  const vRange = maxVal - minVal || 1;
  const totalPts = 90;

  const toX = (idx: number) => ((idx / (totalPts - 1)) * W).toFixed(3);
  const toY = (val: number) => (H - ((val - minVal) / vRange) * H).toFixed(3);

  const histPath = histPoints.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)} ${toY(v)}`).join(" ");
  const projAreaTop = projPoints.map((p) => `L${toX(p.x)} ${toY(p.high)}`).join(" ");
  const projAreaBot = [...projPoints].reverse().map((p) => `L${toX(p.x)} ${toY(p.low)}`).join(" ");
  const projAreaPath = `M${toX(59)} ${toY(price)} ${projAreaTop} ${projAreaBot} Z`;
  const projMidPath = `M${toX(59)} ${toY(price)} ` + projPoints.map((p) => `L${toX(p.x)} ${toY(p.mid)}`).join(" ");

  const histColor = change >= 0 ? "#10b981" : "#ef4444";
  const projColor = combinedScore >= 55 ? "#10b981" : combinedScore >= 35 ? "#f59e0b" : "#ef4444";
  const lastProj = projPoints[projPoints.length - 1];
  const projUpside = ((lastProj.mid - price) / price) * 100;

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">30-Day Price Projection</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ background: histColor }} />
            <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Historical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ background: projColor, opacity: 0.7 }} />
            <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Projection</span>
          </div>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.03)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
          >
            Model
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ overflow: "visible", display: "block" }}
          preserveAspectRatio="none"
        >
          {/* "Now" divider */}
          <line
            x1={toX(59)} y1="0"
            x2={toX(59)} y2={H}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.4"
            strokeDasharray="1.2,0.8"
          />
          {/* Projection uncertainty band */}
          <path d={projAreaPath} fill={projColor} fillOpacity="0.09" />
          {/* Projection midline */}
          <path d={projMidPath} fill="none" stroke={projColor} strokeWidth="0.55" strokeDasharray="1.5,0.8" opacity="0.85" />
          {/* Historical line */}
          <path d={histPath} fill="none" stroke={histColor} strokeWidth="0.65" />
          {/* Current price dot */}
          <circle cx={toX(59)} cy={toY(price)} r="1.1" fill="var(--accent)" />
        </svg>

        <div className="flex justify-between mt-2 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          <span>60d ago</span>
          <span style={{ color: "var(--accent)" }}>Now</span>
          <span>+30d</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-center">
          <div className="text-[9px] mb-1" style={{ color: "var(--text-dim)" }}>Current</div>
          <div className="text-sm font-black font-mono" style={{ color: "var(--text)" }}>${price.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] mb-1" style={{ color: "var(--text-dim)" }}>30d Mid Target</div>
          <div className="text-sm font-black font-mono" style={{ color: projColor }}>${lastProj.mid.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] mb-1" style={{ color: "var(--text-dim)" }}>Projected Δ</div>
          <div className="text-sm font-black font-mono" style={{ color: projUpside >= 0 ? "#10b981" : "#ef4444" }}>
            {projUpside >= 0 ? "+" : ""}{projUpside.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px]" style={{ color: "var(--text-dim)" }}>
        Projection uses beta-adjusted volatility model with momentum bias from score. Illustrative only — not a price guarantee.
      </div>
    </div>
  );
}

/* ══════════════════ Upcoming Events Card ══════════════════ */

function UpcomingEventsCard({
  earningsEstimates,
  dividendPerShare,
  ticker,
}: {
  earningsEstimates: EarningsPeriod[];
  dividendPerShare?: number | null;
  ticker: string;
}) {
  interface EventItem {
    label: string;
    date: string;
    daysUntil: number | null;
    color: string;
    bg: string;
    sub: string | null;
    icon: string;
  }

  const events: EventItem[] = [];

  const quarterMap: Record<string, string> = {
    "0q": "Current Quarter",
    "+1q": "Next Quarter",
    "0y": "Current Year",
    "+1y": "Next Year",
  };

  for (const ep of earningsEstimates) {
    if (!ep.endDate) continue;
    const endDate = new Date(ep.endDate);
    const now = new Date();
    const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
    if (daysUntil < -30) continue;

    const label = quarterMap[ep.period] ?? ep.period;
    const epsAvg = ep.earningsEstimate.avg;
    const revAvg = ep.revenueEstimate.avg;
    const sub = epsAvg !== null
      ? `EPS Est: ${epsAvg >= 0 ? "$" : "-$"}${Math.abs(epsAvg).toFixed(2)}${revAvg !== null
          ? ` · Rev: ${revAvg >= 1e9 ? `$${(revAvg / 1e9).toFixed(1)}B` : `$${(revAvg / 1e6).toFixed(0)}M`}`
          : ""}`
      : null;

    events.push({
      label: `Earnings Report — ${label}`,
      date: ep.endDate.slice(0, 10),
      daysUntil: daysUntil > 0 ? daysUntil : null,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.07)",
      sub,
      icon: "◈",
    });
    if (events.length >= 2) break;
  }

  if (dividendPerShare && dividendPerShare > 0) {
    events.push({
      label: "Annual Dividend",
      date: "Recurring",
      daysUntil: null,
      color: "#10b981",
      bg: "rgba(16,185,129,0.07)",
      sub: `$${dividendPerShare.toFixed(2)} per share (TTM)`,
      icon: "◎",
    });
  }

  if (events.length === 0) {
    events.push({
      label: "Next Earnings Report",
      date: "Date TBA",
      daysUntil: null,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.07)",
      sub: `Check ${ticker} investor relations for confirmed date`,
      icon: "◈",
    });
  }

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-label">Upcoming Events</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>Estimate Data</span>
      </div>
      <div className="space-y-3">
        {events.map((ev, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl p-3.5"
            style={{ background: ev.bg, border: `1px solid ${ev.color}22` }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black"
              style={{ background: ev.color + "18", color: ev.color }}
            >
              {ev.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-semibold" style={{ color: "var(--text)" }}>
                  {ev.label}
                </span>
                {ev.daysUntil !== null && ev.daysUntil > 0 && (
                  <span
                    className="text-[9px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                    style={{ background: ev.color + "18", color: ev.color }}
                  >
                    {ev.daysUntil}d
                  </span>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono font-semibold" style={{ color: ev.color }}>
                  {ev.date}
                </span>
                {ev.sub && (
                  <>
                    <span className="text-[10px]" style={{ color: "var(--border-hover)" }}>·</span>
                    <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{ev.sub}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════ Skeletons ══════════════════ */

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-[1180px] mx-auto mt-8 px-4 sm:px-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-5">
          <div className="shimmer rounded-xl h-64" />
          <div className="shimmer rounded-xl h-80" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="shimmer rounded-xl h-20" />
            ))}
          </div>
          <div className="shimmer rounded-xl h-48" />
          <div className="shimmer rounded-xl h-32" />
          <div className="shimmer rounded-xl h-48" />
          <div className="shimmer rounded-xl h-40" />
          <div className="shimmer rounded-xl h-56" />
        </div>
        <div className="lg:col-span-4 space-y-5">
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
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="shimmer rounded-lg h-[52px]" />
      ))}
    </div>
  );
}

/* ══════════════════ Dashboard Components ══════════════════ */

function TopStockRow({
  stock,
  rank,
  type: _type,
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
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 font-mono"
        style={{
          color: "var(--text-dim)",
          background: "transparent",
        }}
      >
        #{rank}
      </div>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {stock.image && (
          <img
            src={stock.image}
            alt=""
            className="w-7 h-7 rounded-md flex-shrink-0"
            style={{ border: "1px solid var(--border)" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-bold font-mono" style={{ color: "var(--text)" }}>
              {stock.ticker}
            </span>
            <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: stock.ratingColor + "15", color: stock.ratingColor }}>
              {stock.rating}
            </span>
          </div>
          <div className="text-[10px] truncate" style={{ color: "var(--text-dim)" }}>
            {stock.companyName}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 hidden sm:block">
        <div className="text-[13px] font-mono font-semibold" style={{ color: "var(--text)" }}>
          ${stock.price.toFixed(2)}
        </div>
        <div className="text-[10px] font-mono font-semibold" style={{ color: stock.change >= 0 ? "var(--green)" : "var(--red)" }}>
          {stock.change >= 0 ? "+" : ""}
          {stock.changePercent.toFixed(2)}%
        </div>
      </div>
      <div
        className="flex flex-col items-end gap-0.5 flex-shrink-0"
      >
        <div
          className="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black"
          style={{
            background: `${stock.ratingColor}12`,
            border: `1px solid ${stock.ratingColor}25`,
            color: stock.ratingColor,
          }}
        >
          <span className="text-[15px] leading-none">{stock.combinedScore}</span>
          <span className="text-[7px] font-bold opacity-40 leading-none mt-0.5">comb</span>
        </div>
      </div>
      <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-muted)" }}>
        &#8250;
      </span>
    </div>
  );
}

function NewsCard({ article, onClick }: { article: NewsItem; onClick: () => void }) {
  return (
    <div onClick={onClick} className="card news-card rounded-xl overflow-hidden block cursor-pointer">
      {article.thumbnail && (
        <div className="w-full h-32 overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
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
        <h4 className="text-[13px] font-semibold leading-snug mb-2 line-clamp-2" style={{ color: "var(--text)" }}>
          {article.title}
        </h4>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-dim)" }}>
          <span className="font-medium" style={{ color: "var(--text-muted)" }}>{article.publisher}</span>
          <span>·</span>
          <span>{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════ Key Metrics Strip ══════════════════ */

function KeyMetricsStrip({
  result,
  stockDetails,
}: {
  result: EvaluationResult;
  stockDetails: StockDetails | null;
}) {
  const nextEarningsDate =
    stockDetails?.earningsEstimates?.find(
      (e) => e.endDate && new Date(e.endDate) > new Date()
    )?.endDate ?? null;

  const analystTarget = stockDetails?.analystTargets?.targetMean ?? null;
  const upside =
    analystTarget !== null
      ? ((analystTarget - result.price) / result.price) * 100
      : null;

  type Metric = { label: string; value: string; valueColor?: string };
  const metrics: Metric[] = [
    { label: "Market Cap", value: formatNumber(result.marketCap) },
    { label: "P/E Ratio", value: result.pe ? result.pe.toFixed(1) : "N/A" },
    { label: "EPS (TTM)", value: result.eps ? `$${result.eps.toFixed(2)}` : "N/A" },
    { label: "Beta", value: result.beta ? result.beta.toFixed(2) : "N/A" },
  ];

  if (nextEarningsDate) {
    metrics.push({ label: "Next Earnings", value: nextEarningsDate.slice(0, 7) });
  }

  if (analystTarget !== null && upside !== null) {
    metrics.push({
      label: "Analyst Target",
      value: `$${analystTarget.toFixed(0)} (${upside >= 0 ? "+" : ""}${upside.toFixed(0)}%)`,
      valueColor: upside >= 0 ? "#10b981" : "#ef4444",
    });
  }

  const cols =
    metrics.length <= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : metrics.length === 5
        ? "grid-cols-3 sm:grid-cols-5"
        : "grid-cols-3 sm:grid-cols-6";

  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-xl p-3.5 transition-all duration-150"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            {m.label}
          </div>
          <div
            className="text-[13px] font-semibold font-mono leading-none"
            style={{ color: m.valueColor ?? "var(--text)", letterSpacing: "-0.01em" }}
          >
            {m.value}
          </div>
        </div>
      ))}
    </div>
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

  const [topStocks, setTopStocks] = useState<{ topBuy: TopStockItem[]; topSell: TopStockItem[]; all?: TopStockItem[] } | null>(null);
  const [topStocksLoading, setTopStocksLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // New state
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

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

  // Fetch stock details when result changes
  useEffect(() => {
    if (result?.ticker) {
      fetch(`/api/stock-details?ticker=${result.ticker}`)
        .then((res) => res.json())
        .then((data) => setStockDetails(data))
        .catch(() => setStockDetails(null));
    }
  }, [result?.ticker]);

  async function handleEvaluateDirect(t: string) {
    if (!t) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStockDetails(null);
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

  async function handleEvaluate(e?: React.SyntheticEvent) {
    e?.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setTicker(t);
    await handleEvaluateDirect(t);
  }

  function goHome() {
    setSearched(false);
    setResult(null);
    setStockDetails(null);
    setError("");
    setTicker("");
    window.history.pushState({}, "", "/");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const popular = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "JPM"];

  const totalMetrics = result ? result.categories.reduce((sum, c) => sum + c.metrics.filter((m) => m.value !== "N/A").length, 0) : 0;
  const totalBuy = result ? result.categories.reduce((sum, c) => sum + c.metrics.filter((m) => m.score === 1).length, 0) : 0;
  const totalSell = result ? result.categories.reduce((sum, c) => sum + c.metrics.filter((m) => m.score === -1).length, 0) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* ═══════ Header ═══════ */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(0, 0, 0, 0.95)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <button
            onClick={goHome}
            className="flex items-center gap-2 flex-shrink-0 group"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              S
            </div>
            <span
              className="text-[13px] font-semibold tracking-tight transition-colors duration-150 group-hover:text-white hidden sm:block"
              style={{ color: "var(--text-muted)", letterSpacing: "-0.01em" }}
            >
              StockGrade
            </span>
          </button>

          {/* Search bar — only when in results view */}
          {searched && (
            <form onSubmit={handleEvaluate} className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Search ticker…"
                  className="w-full pl-9 pr-8 py-2 rounded-lg text-[13px] font-mono placeholder:text-zinc-600 transition-all focus:outline-none"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    letterSpacing: "0.02em",
                  }}
                />
                {ticker && (
                  <button
                    type="button"
                    onClick={() => setTicker("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded cursor-pointer transition-colors hover:text-white text-[10px]"
                    style={{ color: "var(--text-dim)" }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="btn-primary px-4 py-2 text-[12px] whitespace-nowrap flex-shrink-0"
              >
                {loading ? <span className="pulse-glow">…</span> : "Analyze"}
              </button>
            </form>
          )}

          <div className="ml-auto flex items-center gap-2">
            {searched && (
              <button
                onClick={goHome}
                className="btn-ghost text-[12px] font-medium px-3 py-1.5 hidden md:flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Home</span>
              </button>
            )}
            <div
              className="text-[9px] font-semibold px-2 py-1 rounded tracking-[0.1em] hidden sm:block"
              style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
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
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(0,191,165,0.06) 0%, transparent 60%)" }}
            />

            <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-14 sm:pt-20 pb-8 sm:pb-10">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.15em] px-3 py-1 rounded mb-5 animate-fade-in"
                style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
              >
                350+ Metrics · Real Data · Transparent Scoring
              </div>

              <h1
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-center mb-4 animate-fade-in stagger-1"
                style={{ color: "var(--text)", lineHeight: 1.08, maxWidth: "700px" }}
              >
                Smarter Stock Picks.{" "}
                <span className="gradient-text">Backed by Data.</span>
              </h1>

              <p className="text-sm sm:text-base text-center max-w-lg mb-7 animate-fade-in stagger-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Transparent grading system using fundamentals, technicals, and sentiment.
                Every score explained. Every metric visible.
              </p>

              {/* Search Box */}
              <form onSubmit={handleEvaluate} className="w-full max-w-2xl mx-auto animate-fade-in stagger-2">
                <div className="search-input-wrapper">
                  <div className="search-input-inner">
                    <div className="flex items-center gap-3 px-4 sm:px-5 text-zinc-500">
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
                      placeholder="Enter stock ticker (AAPL, TSLA, NVDA...)"
                      className="flex-1 py-4 sm:py-5 text-base sm:text-lg font-mono bg-transparent placeholder:text-zinc-600 tracking-wide"
                      style={{ color: "var(--text)", border: "none", outline: "none" }}
                      autoFocus
                    />
                    {ticker && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicker("");
                          inputRef.current?.focus();
                        }}
                        className="px-3 text-zinc-500 hover:text-white cursor-pointer transition-colors"
                      >
                        &#10005;
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !ticker.trim()}
                      className="btn-primary m-1.5 px-6 sm:px-8 py-2.5 sm:py-3 text-sm rounded"
                    >
                      {loading ? <span className="pulse-glow">Analyzing...</span> : "Analyze Stock"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-3 flex items-center gap-2 animate-fade-in stagger-3 flex-wrap justify-center">
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>Recent</span>
                  <div className="w-px h-3" style={{ background: "var(--border)" }} />
                  {recentSearches.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setTicker(t); handleEvaluateDirect(t); }}
                      className="px-3 py-1 rounded text-[11px] font-mono font-semibold cursor-pointer ticker-btn"
                      style={{ color: "var(--accent)", border: "1px solid var(--accent-border)", background: "var(--accent-dim)" }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Popular Tickers */}
              <div className="mt-3 flex flex-wrap justify-center gap-2 animate-fade-in stagger-3">
                {popular.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTicker(t)}
                    className="px-3.5 py-1.5 text-[12px] font-mono font-semibold cursor-pointer ticker-btn"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "6px" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ Feature Strip — 3 Cards ═══════ */}
          <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: "◎",
                  title: "Transparent Scoring",
                  desc: "Every metric explained. See exactly how each score is calculated across 9 categories.",
                  color: "var(--accent)",
                },
                {
                  icon: "◆",
                  title: "Real Performance Tracking",
                  desc: "Track past picks, win rate, and returns compared to the S&P 500.",
                  color: "#3b82f6",
                },
                {
                  icon: "⬡",
                  title: "Multi-Source Data",
                  desc: "Fundamentals, technicals, sentiment, and risk — all from trusted data sources.",
                  color: "#a78bfa",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl p-5 transition-all duration-200 hover:translate-y-[-2px]"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black mb-3"
                    style={{ background: card.color + "12", color: card.color }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-sm font-bold mb-1.5" style={{ color: "var(--text)" }}>{card.title}</h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════ Today's Top Picks ═══════ */}
          <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
              <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>Today&apos;s Top Picks</h2>
              <div className="flex-1 h-px ml-2" style={{ background: "var(--border)" }} />
            </div>

            {topStocksLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="shimmer rounded-xl h-36" />)}
              </div>
            ) : topStocks?.topBuy?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topStocks.topBuy.slice(0, 5).map((stock) => {
                  const riskFromScore = stock.combinedScore >= 65 ? "Low" : stock.combinedScore >= 40 ? "Moderate" : "High";
                  const riskColor = riskFromScore === "Low" ? "#10b981" : riskFromScore === "Moderate" ? "#f59e0b" : "#ef4444";
                  return (
                    <div
                      key={stock.ticker}
                      onClick={() => handleEvaluateDirect(stock.ticker)}
                      className="rounded-xl p-4 cursor-pointer transition-all duration-200 hover:translate-y-[-2px] group"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          {stock.image && (
                            <img
                              src={stock.image}
                              alt=""
                              className="w-8 h-8 rounded-lg flex-shrink-0"
                              style={{ border: "1px solid var(--border)" }}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-black font-mono" style={{ color: "var(--text)" }}>{stock.ticker}</div>
                            <div className="text-[10px] truncate max-w-[120px]" style={{ color: "var(--text-dim)" }}>{stock.companyName}</div>
                          </div>
                        </div>
                        <div
                          className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                          style={{ background: stock.ratingColor + "12", border: `1px solid ${stock.ratingColor}28` }}
                        >
                          <span className="text-lg font-black font-mono leading-none" style={{ color: stock.ratingColor }}>{stock.combinedScore}</span>
                          <span className="text-[7px] font-bold opacity-50 mt-0.5" style={{ color: stock.ratingColor }}>/100</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                          style={{ background: stock.ratingColor + "12", color: stock.ratingColor }}
                        >
                          {stock.rating}
                        </span>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded"
                          style={{ background: riskColor + "12", color: riskColor }}
                        >
                          {riskFromScore} Risk
                        </span>
                        <span className="text-[10px] font-mono ml-auto" style={{ color: stock.changePercent >= 0 ? "var(--green)" : "var(--red)" }}>
                          {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card rounded-xl p-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>Loading top picks...</p>
              </div>
            )}
          </div>

          {/* ═══════ Performance Preview ═══════ */}
          <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 pb-10">
            <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} />
                <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Our Picks vs The Market</h2>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-black font-mono" style={{ color: "var(--accent)" }}>350+</div>
                  <div className="text-[10px] font-medium mt-1" style={{ color: "var(--text-dim)" }}>Metrics Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black font-mono" style={{ color: "#10b981" }}>9</div>
                  <div className="text-[10px] font-medium mt-1" style={{ color: "var(--text-dim)" }}>Score Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black font-mono" style={{ color: "#a78bfa" }}>4</div>
                  <div className="text-[10px] font-medium mt-1" style={{ color: "var(--text-dim)" }}>Pillar Scores</div>
                </div>
              </div>
              <div className="mt-5 pt-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  Each stock is graded on Fundamentals (40pts), Technicals (30pts), Sentiment (20pts), and Risk (10pts) for a transparent 100-point score.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════ Market Movers ═══════ */}
          {!topStocksLoading && <MarketPulseStrip topStocks={topStocks} onEvaluate={handleEvaluateDirect} />}

          {/* ═══════ Full Rankings ═══════ */}
          <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 pt-2 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card rounded-xl p-4 sm:p-5 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
                <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Top 5 Highest Rated</h2>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>Ranked 100 → down</div>
                  </div>
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
                  <div className="text-center py-10 text-sm" style={{ color: "var(--text-dim)" }}>
                    No data available
                  </div>
                )}
              </div>

              <div className="card rounded-xl p-4 sm:p-5 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
                <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--red)" }} />
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Top 5 Lowest Rated</h2>
                    <div className="text-[9px] font-mono mt-0.5" style={{ color: "var(--text-dim)" }}>Ranked 0 → up</div>
                  </div>
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
                  <div className="text-center py-10 text-sm" style={{ color: "var(--text-dim)" }}>
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════ News ═══════ */}
          <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 pt-2 pb-10">
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
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="shimmer rounded-xl h-52" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {news.slice(0, 8).map((article, i) => (
                  <NewsCard key={i} article={article} onClick={() => setSelectedNews(article)} />
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
        <div className="pt-4 pb-3 relative z-10">
          <div className="flex gap-2.5 max-w-2xl mx-auto px-4 sm:px-6 md:hidden">
            <button
              onClick={goHome}
              className="btn-ghost px-4 py-3 font-bold text-sm flex-shrink-0"
            >
              &#8592;
            </button>
            <form onSubmit={handleEvaluate} className="flex gap-2.5 flex-1">
              <div className="relative flex-1">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Search ticker..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-mono placeholder:text-zinc-600 focus:outline-none transition-all"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-hover)", color: "var(--text)" }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="btn-primary px-6 py-3 text-sm whitespace-nowrap flex-shrink-0"
              >
                {loading ? <span className="pulse-glow">...</span> : "Analyze"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ Error ═══════ */}
      {error && (
        <div className="max-w-xl mx-auto px-4 sm:px-6 mb-4 relative z-10">
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
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 pb-12 relative z-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ──── Main Column (8/12) ──── */}
            <div className="lg:col-span-8 space-y-5">
              {/* ── Company Header ── */}
              <div
                className="rounded-2xl p-5 sm:p-6"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {/* Top row: logo + name + score gauge */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    {result.image && (
                      <img
                        src={result.image}
                        alt=""
                        className="w-11 h-11 rounded-xl flex-shrink-0 object-contain"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-elevated)" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2
                          className="text-2xl font-black leading-none"
                          style={{ color: "var(--text)", letterSpacing: "-0.03em" }}
                        >
                          {result.ticker}
                        </h2>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase"
                          style={{ background: result.ratingColor + "14", color: result.ratingColor, border: `1px solid ${result.ratingColor}28` }}
                        >
                          {result.rating}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
                        {result.companyName}
                      </p>
                      {result.sector && (
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                          {result.sector}{result.industry ? ` · ${result.industry}` : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Combined Score badge */}
                  <div
                    className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl"
                    style={{ background: result.ratingColor + "12", border: `2px solid ${result.ratingColor}30` }}
                  >
                    <span className="text-[26px] font-black font-mono leading-none" style={{ color: result.ratingColor, letterSpacing: "-0.04em" }}>
                      {result.combinedScore}
                    </span>
                    <span className="text-[9px] font-bold opacity-50 mt-0.5" style={{ color: result.ratingColor }}>/100</span>
                  </div>
                </div>

                {/* Price row */}
                <div className="flex flex-wrap items-baseline gap-2.5 mb-4">
                  <span
                    className="font-mono font-black leading-none"
                    style={{ fontSize: "clamp(26px,4vw,40px)", color: "var(--text)", letterSpacing: "-0.04em" }}
                  >
                    ${result.price.toFixed(2)}
                  </span>
                  <span
                    className="text-[13px] font-semibold px-2 py-0.5 rounded-md font-mono"
                    style={{
                      color: result.change >= 0 ? "var(--green)" : "var(--red)",
                      background: result.change >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    }}
                  >
                    {result.change >= 0 ? "+" : ""}{result.change.toFixed(2)} ({result.changePercent.toFixed(2)}%)
                  </span>
                </div>

                {/* Range bars */}
                <div className="space-y-2 mb-4">
                  {result.dayHigh > 0 && <RangeBar low={result.dayLow} high={result.dayHigh} current={result.price} label="Today" />}
                  {result.yearHigh > 0 && <RangeBar low={result.yearLow} high={result.yearHigh} current={result.price} label="52 Week" />}
                </div>

                {/* Mobile signal counts */}
                <div className="flex sm:hidden items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{totalMetrics} metrics</span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--green)" }}>{totalBuy} buy</span>
                  <span className="text-[10px] font-semibold" style={{ color: "var(--red)" }}>{totalSell} sell</span>
                </div>

                {/* Footer: metrics count + share */}
                <div
                  className="flex items-center justify-between pt-3 mt-1"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                    {totalMetrics} metrics evaluated
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      const btn = document.getElementById("share-btn");
                      if (btn) {
                        btn.textContent = "Copied!";
                        setTimeout(() => { btn.textContent = "Share"; }, 2000);
                      }
                    }}
                    id="share-btn"
                    className="text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-all hover:brightness-110"
                    style={{ color: "var(--accent)", border: "1px solid var(--accent-border)", background: "var(--accent-dim)" }}
                  >
                    Share
                  </button>
                </div>
              </div>

              {/* ── Decision Hero ── */}
              <ShouldYouBuyNowBox
                result={result}
                totalBuy={totalBuy}
                totalSell={totalSell}
                totalMetrics={totalMetrics}
                analystTargets={stockDetails?.analystTargets ?? null}
              />

              {/* ── Key Metrics Strip ── */}
              <KeyMetricsStrip result={result} stockDetails={stockDetails} />

              {/* ── AI Summary ── */}
              <AIVerdictBanner
                ticker={result.ticker}
                score={result.combinedScore}
                totalBuy={totalBuy}
                totalSell={totalSell}
                totalMetrics={totalMetrics}
                categories={result.categories}
                analystTargets={stockDetails?.analystTargets ?? null}
                currentPrice={result.price}
                ratingColor={result.ratingColor}
                rating={result.rating}
              />

              {/* ── Price Outlook ── */}
              <MirofishRatingCard result={result} />

              <PriceProjPanel
                result={result}
                analystTargets={stockDetails?.analystTargets ?? null}
              />

              {/* ── Hybrid Forecast ── */}
              <HybridForecast
                result={result}
                analystTargets={stockDetails?.analystTargets ?? null}
              />

              {/* ── Price Chart ── */}
              <PriceChart ticker={result.ticker} currentPrice={result.price} change={result.change} changePercent={result.changePercent} />

              {/* ── Technical Analysis (collapsible) ── */}
              <CollapsibleSection title="Technical Analysis">
                <div className="space-y-5">
                  <TechnicalIndicators ticker={result.ticker} />
                  {stockDetails?.analystTargets && (
                    <AnalystTargetsSection targets={stockDetails.analystTargets} currentPrice={result.price} />
                  )}
                  {stockDetails?.esg && <ESGSection esg={stockDetails.esg} />}
                  {stockDetails && (
                    <PriceOutlook
                      earningsEstimates={stockDetails.earningsEstimates ?? []}
                      recommendationTrends={stockDetails.recommendationTrends ?? []}
                      ownership={stockDetails.ownership ?? null}
                      currentPrice={result.price}
                      analystTargets={stockDetails.analystTargets}
                    />
                  )}
                  <UpcomingEventsCard
                    earningsEstimates={stockDetails?.earningsEstimates ?? []}
                    dividendPerShare={null}
                    ticker={result.ticker}
                  />
                </div>
              </CollapsibleSection>

              {/* ── Financial Details (collapsible) ── */}
              <CollapsibleSection title="Financial Details">
                <div className="space-y-5">
                  {result.fundamentalsScore && (
                    <FourPillarBreakdown result={result} />
                  )}
                  {result.bearCase && result.bearCase.length > 0 && (
                    <RiskBearCaseSection result={result} />
                  )}
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
                </div>
              </CollapsibleSection>

              {/* ── Activity & News (collapsible) ── */}
              <CollapsibleSection title="Activity & News">
                <div className="space-y-5">
                  <SentimentNewsSection ticker={result.ticker} onSelectArticle={setSelectedNews} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InsiderTradingPanel ticker={result.ticker} />
                    <InstitutionalHoldingsPanel ticker={result.ticker} />
                  </div>
                  <SECFilingsPanel ticker={result.ticker} />
                </div>
              </CollapsibleSection>

              {/* ── About (collapsible) ── */}
              {result.description && (
                <CollapsibleSection title={`About ${result.companyName}`}>
                  <div className="card rounded-xl p-5">
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
                </CollapsibleSection>
              )}

              {/* ── Full Score Breakdown (collapsible) ── */}
              <CollapsibleSection title="Full Score Breakdown" badge={`${result.combinedScore}/100`} badgeColor={result.ratingColor}>

              {/* Verdict + Scores */}
              <div className="rounded-xl p-5 space-y-4" style={{ background: result.ratingColor + "06", border: `1px solid ${result.ratingColor}18` }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-black" style={{ color: result.ratingColor }}>
                      Verdict: {result.rating}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      Based on {totalMetrics} metrics across {result.categories.length} categories.
                      {totalBuy > totalSell
                        ? ` ${totalBuy} buy vs ${totalSell} sell signals — positive outlook.`
                        : totalSell > totalBuy
                          ? ` ${totalSell} sell vs ${totalBuy} buy signals — exercise caution.`
                          : " Signals evenly split between buy and sell."}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                    {timeAgo(result.evaluatedAt)}
                  </div>
                </div>
                <FourScorePanel
                  qualityScore={result.qualityScore}
                  growthScore={result.growthScore}
                  valueScore={result.valueScore}
                  combinedScore={result.combinedScore}
                  ratingColor={result.ratingColor}
                  compact
                />
              </div>

              {/* Score Insights */}
              <ScoreInsightsPanel categories={result.categories} score={result.combinedScore} rating={result.rating} ratingColor={result.ratingColor} />

              {/* Score Drivers */}
              <ScoreDrivers categories={result.categories} />

              {/* Signals + Categories in collapsible */}
              <CollapsibleSection title="Signals & Detailed Breakdown" badge={`${totalBuy} buy · ${totalSell} sell`}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <SignalCard title="Top Buy Signals" metrics={result.topSignals} color="#10b981" icon="&#9650;" />
                    <SignalCard title="Red Flags" metrics={result.redFlags} color="#ef4444" icon="&#9660;" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                        Category Breakdown
                      </h2>
                      <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                        Click to expand
                      </span>
                    </div>
                    <div className="space-y-2">
                      {result.categories.map((cat, i) => (
                        <CategoryBar key={i} category={cat} index={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Scale */}
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="section-label mb-3">Scoring Scale</h3>
                <div className="flex gap-1.5">
                  {[
                    { range: "75–100", label: "STRONG BUY", color: "#22c55e" },
                    { range: "55–74",  label: "BUY",         color: "#4ade80" },
                    { range: "35–54",  label: "HOLD",        color: "#f59e0b" },
                    { range: "15–34",  label: "UNDER",       color: "#f97316" },
                    { range: "0–14",   label: "SELL",        color: "#ef4444" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex-1 py-2.5 rounded-lg text-center"
                      style={{ background: r.color + "0c", border: `1px solid ${r.color}22` }}
                    >
                      <div className="text-[8px] font-black tracking-wider leading-none" style={{ color: r.color }}>
                        {r.label}
                      </div>
                      <div className="text-[8px] mt-1 font-mono opacity-50 leading-none" style={{ color: r.color }}>
                        {r.range}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              </CollapsibleSection>

              {/* Timestamps */}
              <TimestampBadge result={result} />

              {/* Disclaimer */}
              <p className="text-[11px] leading-relaxed px-1" style={{ color: "var(--text-dim)" }}>
                For informational purposes only. Not financial advice. Always conduct your own due diligence before making investment decisions.
              </p>
            </div>

            {/* ──── Sidebar ──── */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-[72px] space-y-4">
                <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="section-label mb-3">Category Scores</h3>
                  <CategorySummary categories={result.categories} />
                </div>

                <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="section-label mb-3">Quick Info</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: "Exchange", value: result.exchange },
                      { label: "Sector",   value: result.sector },
                      { label: "Industry", value: result.industry },
                      { label: "Country",  value: result.country },
                    ]
                      .filter((item) => item.value)
                      .map((item) => (
                        <div key={item.label} className="flex justify-between items-center gap-2">
                          <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-dim)" }}>
                            {item.label}
                          </span>
                          <span className="text-[11px] font-medium text-right truncate" style={{ color: "var(--text-secondary)" }}>
                            {item.value}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Market Rank in sidebar */}
                {topStocks?.all && (() => {
                  const rankIndex = topStocks.all!.findIndex((s) => s.ticker === result.ticker);
                  if (rankIndex === -1) return null;
                  const rank = rankIndex + 1;
                  const total = topStocks.all!.length;
                  const pct = Math.round(((total - rank) / total) * 100);
                  return (
                    <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                      <h3 className="section-label mb-3">Universe Rank</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl font-black font-mono" style={{ color: "var(--accent)", letterSpacing: "-0.03em" }}>
                          #{rank}
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                            of {total} stocks
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "var(--text-dim)" }}>
                            Better than {pct}%
                          </div>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full metric-bar" style={{ width: `${pct}%`, background: "var(--accent)" }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Analyst Consensus in sidebar */}
                {stockDetails?.analystTargets?.recommendationKey && (
                  <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h3 className="section-label mb-3">Analyst Consensus</h3>
                    {(() => {
                      const rk = stockDetails.analystTargets!.recommendationKey!;
                      const recColor = rk === "buy" || rk === "strong_buy" ? "#22c55e" : rk === "hold" ? "#f59e0b" : "#ef4444";
                      return (
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[18px] font-black capitalize" style={{ color: recColor, letterSpacing: "-0.02em" }}>
                              {rk.replace(/_/g, " ")}
                            </span>
                            {stockDetails.analystTargets!.numberOfAnalysts && (
                              <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                                {stockDetails.analystTargets!.numberOfAnalysts} analysts
                              </span>
                            )}
                          </div>
                          {stockDetails.analystTargets!.recommendationMean && (
                            <div className="mt-2">
                              <div className="flex justify-between text-[9px] font-mono mb-1.5" style={{ color: "var(--text-dim)" }}>
                                <span>Strong Buy</span><span>Sell</span>
                              </div>
                              <div className="h-1 rounded-full" style={{ background: "var(--border)" }}>
                                <div className="h-full rounded-full" style={{ width: `${((stockDetails.analystTargets!.recommendationMean - 1) / 4) * 100}%`, background: "linear-gradient(90deg, #22c55e, #f59e0b, #ef4444)" }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <h3 className="section-label mb-3">Quick Evaluate</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {popular
                      .filter((t) => t !== result.ticker)
                      .slice(0, 6)
                      .map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTicker(t); handleEvaluateDirect(t); }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold cursor-pointer ticker-btn"
                          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
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

      {/* ═══════ News Modal ═══════ */}
      {selectedNews && <NewsModal article={selectedNews} onClose={() => setSelectedNews(null)} />}

      {/* ═══════ Footer ═══════ */}
      <footer className="relative z-10 mt-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white flex-shrink-0" style={{ background: "var(--accent)" }}>
                  S
                </div>
                <span className="text-[13px] font-bold" style={{ color: "var(--text-secondary)" }}>StockGrade</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
                Transparent, data-driven stock analysis powered by 350+ quantitative metrics.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Resources</h4>
              <div className="space-y-2">
                <a href="/methodology" className="block text-[12px] transition-colors hover:text-white" style={{ color: "var(--text-muted)" }}>Methodology</a>
                <button onClick={() => { setTicker("AAPL"); handleEvaluateDirect("AAPL"); }} className="block text-[12px] transition-colors hover:text-white cursor-pointer" style={{ color: "var(--text-muted)", background: "none", border: "none", padding: 0 }}>Example Analysis</button>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-dim)" }}>Legal</h4>
              <div className="space-y-2">
                <span className="block text-[12px]" style={{ color: "var(--text-muted)" }}>Disclaimer</span>
                <span className="block text-[12px]" style={{ color: "var(--text-muted)" }}>About</span>
              </div>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-[11px] font-medium" style={{ color: "var(--text-dim)" }}>
              &copy; {new Date().getFullYear()} StockGrade. All rights reserved.
            </span>
            <p className="text-[10px]" style={{ color: "var(--text-dim)", opacity: 0.45 }}>
              Data via Yahoo Finance &middot; Not financial advice &middot; For informational purposes only
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
