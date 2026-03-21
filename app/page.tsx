"use client";

import { useState, useRef, useEffect } from "react";
import type { EvaluationResult, CategoryScore, MetricScore } from "@/lib/types";
import { formatNumber, cn, timeAgo } from "@/lib/utils";
import ScoreGauge from "@/components/score-gauge";
import PriceChart from "@/components/price-chart";

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

interface StockDetails {
  analystTargets: AnalystTargets | null;
  esg: ESGData | null;
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
            style={{ background: "var(--accent)", borderColor: "var(--bg)", boxShadow: `0 0 8px rgba(99,102,241,0.5)` }}
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
      insights.push({ icon: "→", color: "#6366f1", text: `Signal distribution is bullish: ${totalBuy} buy vs ${totalSell} sell across all metrics.` });
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mb-4">
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

/* ══════════════════ Skeletons ══════════════════ */

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto mt-8 px-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="shimmer rounded-xl h-64" />
          <div className="shimmer rounded-xl h-80" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="shimmer rounded-xl h-20" />
            ))}
          </div>
          <div className="shimmer rounded-xl h-48" />
          <div className="shimmer rounded-xl h-32" />
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
        className="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black flex-shrink-0"
        style={{
          background: `${stock.ratingColor}12`,
          border: `1px solid ${stock.ratingColor}25`,
          color: stock.ratingColor,
        }}
      >
        <span className="text-[15px] leading-none">{stock.finalScore}</span>
        <span className="text-[7px] font-bold opacity-40 leading-none mt-0.5">/100</span>
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
          background: "rgba(9, 9, 11, 0.92)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
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
              className="text-[9px] font-bold px-2.5 py-1 rounded-md tracking-widest hidden sm:block"
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
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 60%)" }}
            />
            <div
              className="absolute top-40 left-1/4 w-[300px] h-[300px] pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)" }}
            />

            <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16">
              <div
                className="text-[10px] font-bold uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full mb-8 animate-fade-in"
                style={{ background: "rgba(99,102,241,0.06)", color: "var(--accent)", border: "1px solid rgba(99,102,241,0.12)" }}
              >
                Institutional-Grade Analysis
              </div>

              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-center mb-5 animate-fade-in stagger-1"
                style={{ color: "var(--text)", lineHeight: 1.05 }}
              >
                Evaluate Any
                <br />
                <span className="gradient-text">Stock</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-center max-w-md mb-8 sm:mb-10 animate-fade-in stagger-2" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                350+ quantitative metrics. Instant Buy/Sell ratings.
                <br className="hidden sm:block" /> The analysis pros use, available to everyone.
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
                      placeholder="Search any ticker... AAPL, TSLA, NVDA"
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
                      className="m-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-30 cursor-pointer hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}
                    >
                      {loading ? <span className="pulse-glow">Analyzing...</span> : "Evaluate"}
                    </button>
                  </div>
                </div>
              </form>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mt-5 flex items-center gap-2 animate-fade-in stagger-3 flex-wrap justify-center">
                  <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
                    Recent
                  </span>
                  <div className="w-px h-3" style={{ background: "var(--border)" }} />
                  {recentSearches.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTicker(t);
                        handleEvaluateDirect(t);
                      }}
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
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-mono font-semibold cursor-pointer ticker-btn"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ Market Movers ═══════ */}
          {!topStocksLoading && <MarketPulseStrip topStocks={topStocks} onEvaluate={handleEvaluateDirect} />}

          {/* ═══════ Rankings ═══════ */}
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pb-12">
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
        <div className="pt-3 pb-2 relative z-10">
          <div className="flex gap-2 max-w-lg mx-auto px-4 sm:px-6 md:hidden">
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
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 relative z-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* ──── Main Column (3/4) ──── */}
            <div className="lg:col-span-3 space-y-4">
              {/* Company Header */}
              <div className="card rounded-xl p-5 sm:p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {result.image && (
                        <img
                          src={result.image}
                          alt=""
                          className="w-12 h-12 rounded-xl flex-shrink-0"
                          style={{ border: "1px solid var(--border)" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>
                            {result.ticker}
                          </h2>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: result.ratingColor + "15", color: result.ratingColor }}>
                            {result.rating}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                          {result.companyName}
                        </p>
                        {result.sector && (
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {result.sector} · {result.industry}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3 mb-4">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-tighter" style={{ color: "var(--text)" }}>
                        ${result.price.toFixed(2)}
                      </span>
                      <span
                        className="text-sm font-semibold px-2.5 py-1 rounded-md"
                        style={{
                          color: result.change >= 0 ? "var(--green)" : "var(--red)",
                          background: result.change >= 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                        }}
                      >
                        {result.change >= 0 ? "+" : ""}
                        {result.change.toFixed(2)} ({result.changePercent.toFixed(2)}%)
                      </span>
                    </div>

                    {result.dayHigh > 0 && <RangeBar low={result.dayLow} high={result.dayHigh} current={result.price} label="Today" />}
                    {result.yearHigh > 0 && <RangeBar low={result.yearLow} high={result.yearHigh} current={result.price} label="52 Week" />}
                  </div>

                  <div className="flex flex-col items-center flex-shrink-0">
                    <ScoreGauge score={result.finalScore} rating={result.rating} ratingColor={result.ratingColor} size={170} />
                    <div className="mt-2 text-center">
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {totalMetrics} metrics evaluated
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-0.5">
                        <span className="text-[11px] font-semibold" style={{ color: "#10b981" }}>
                          {totalBuy} buy
                        </span>
                        <span className="text-[11px] font-semibold" style={{ color: "#ef4444" }}>
                          {totalSell} sell
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        const btn = document.getElementById("share-btn");
                        if (btn) {
                          btn.textContent = "Copied!";
                          setTimeout(() => {
                            btn.textContent = "Share Link";
                          }, 2000);
                        }
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

              {/* ─── Price Chart ─── */}
              <PriceChart ticker={result.ticker} currentPrice={result.price} change={result.change} changePercent={result.changePercent} />

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

              {/* ─── Analyst Price Targets ─── */}
              {stockDetails?.analystTargets && (
                <AnalystTargetsSection targets={stockDetails.analystTargets} currentPrice={result.price} />
              )}

              {/* ─── ESG Risk Assessment ─── */}
              {stockDetails?.esg && <ESGSection esg={stockDetails.esg} />}

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
              <div className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ background: result.ratingColor + "06", border: `1px solid ${result.ratingColor}18` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black flex-shrink-0" style={{ background: result.ratingColor + "12", color: result.ratingColor }}>
                  {result.finalScore}
                </div>
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
                <div className="text-[10px] font-mono flex-shrink-0 text-right" style={{ color: "var(--text-dim)" }}>
                  {timeAgo(result.evaluatedAt)}
                </div>
              </div>

              {/* Score Insights */}
              <ScoreInsightsPanel categories={result.categories} score={result.finalScore} rating={result.rating} ratingColor={result.ratingColor} />

              {/* Signals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SignalCard title="Top Buy Signals" metrics={result.topSignals} color="#10b981" icon="&#9650;" />
                <SignalCard title="Red Flags" metrics={result.redFlags} color="#ef4444" icon="&#9660;" />
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    Detailed Breakdown
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

              {/* Scale */}
              <div className="card rounded-xl p-5">
                <h3 className="section-label mb-3">Scoring Scale</h3>
                <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
                  {[
                    { range: "75-100", label: "STRONG BUY", color: "#22c55e" },
                    { range: "55-74", label: "BUY", color: "#4ade80" },
                    { range: "35-54", label: "HOLD", color: "#f59e0b" },
                    { range: "15-34", label: "UNDER", color: "#f97316" },
                    { range: "0-14", label: "SELL", color: "#ef4444" },
                  ].map((r) => (
                    <div key={r.label} className="py-2.5 sm:py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)" }}>
                      <div className="text-[8px] sm:text-[9px] font-black tracking-wide" style={{ color: r.color }}>
                        {r.label}
                      </div>
                      <div className="text-[8px] sm:text-[9px] mt-0.5 font-mono" style={{ color: "var(--text-dim)" }}>
                        {r.range}
                      </div>
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
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {item.label}
                          </span>
                          <span className="text-[11px] font-semibold text-right max-w-[55%] truncate" style={{ color: "var(--text-secondary)" }}>
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
                    <div className="card rounded-xl p-4">
                      <h3 className="section-label mb-3">Universe Rank</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl font-black font-mono" style={{ color: "var(--accent)" }}>
                          #{rank}
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                            of {total} stocks
                          </div>
                          <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                            Better than {pct}%
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--accent), var(--blue))" }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Analyst Consensus in sidebar */}
                {stockDetails?.analystTargets?.recommendationKey && (
                  <div className="card rounded-xl p-4">
                    <h3 className="section-label mb-2.5">Analyst Consensus</h3>
                    <div className="text-center py-2">
                      <div
                        className="text-lg font-black uppercase"
                        style={{
                          color:
                            stockDetails.analystTargets.recommendationKey === "buy" || stockDetails.analystTargets.recommendationKey === "strong_buy"
                              ? "#10b981"
                              : stockDetails.analystTargets.recommendationKey === "hold"
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      >
                        {stockDetails.analystTargets.recommendationKey.replace(/_/g, " ")}
                      </div>
                      {stockDetails.analystTargets.numberOfAnalysts && (
                        <div className="text-[10px] mt-1" style={{ color: "var(--text-dim)" }}>
                          Based on {stockDetails.analystTargets.numberOfAnalysts} analysts
                        </div>
                      )}
                      {stockDetails.analystTargets.recommendationMean && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] font-mono mb-1" style={{ color: "var(--text-dim)" }}>
                            <span>Strong Buy</span>
                            <span>Sell</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${((stockDetails.analystTargets.recommendationMean - 1) / 4) * 100}%`,
                                background: "linear-gradient(90deg, #10b981, #f59e0b, #ef4444)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="card rounded-xl p-4">
                  <h3 className="section-label mb-2.5">Quick Evaluate</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {popular
                      .filter((t) => t !== result.ticker)
                      .slice(0, 6)
                      .map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setTicker(t);
                            handleEvaluateDirect(t);
                          }}
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

      {/* ═══════ News Modal ═══════ */}
      {selectedNews && <NewsModal article={selectedNews} onClose={() => setSelectedNews(null)} />}

      {/* ═══════ Footer ═══════ */}
      <footer className="relative z-10 mt-auto" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white" style={{ background: "linear-gradient(135deg, var(--accent), var(--blue))" }}>
                S
              </div>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-dim)" }}>
                StockGrade &copy; {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-[10px] text-center sm:text-right" style={{ color: "var(--text-dim)", opacity: 0.5 }}>
              Data provided by Yahoo Finance. Scores are algorithmically generated. Not financial advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
