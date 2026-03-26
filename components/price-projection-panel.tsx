"use client";

import { useState } from "react";
import type { EvaluationResult } from "@/lib/types";

/* ── Types ── */

interface AnalystTargets {
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
}

type Horizon = 1 | 3 | 6 | 12;

const HORIZONS: { value: Horizon; label: string; tradingDays: number }[] = [
  { value: 1,  label: "1M",  tradingDays: 21  },
  { value: 3,  label: "3M",  tradingDays: 63  },
  { value: 6,  label: "6M",  tradingDays: 126 },
  { value: 12, label: "1Y",  tradingDays: 252 },
];

/* ── Projection math ── */

function calcProjection(
  price: number,
  beta: number | null | undefined,
  yearHigh: number,
  yearLow: number,
  change: number,
  score: number,
  analystTargets: AnalystTargets | null,
  horizon: Horizon
) {
  // 1. Annual volatility — beta-adjusted (market ~16%, residual ~5%)
  const annualVol = Math.min(0.65, Math.max(0.08, Math.abs(beta ?? 1) * 0.16 + 0.05));

  // 2. Trend bias — 52-week position + recent momentum + score signal
  const yearRange = Math.max(yearHigh - yearLow, price * 0.02);
  const posInRange = Math.min(1, Math.max(0, (price - yearLow) / yearRange));
  const trendBias =
    (posInRange - 0.5) * 0.12 +            // range position signal
    (change >= 0 ? 0.015 : -0.015) +       // recent momentum
    ((score - 50) / 100) * 0.10;           // score-based forward lean

  // 3. Time-horizon scaling
  const T = horizon / 12; // years
  const tVol = annualVol * Math.sqrt(T);
  const baseModel = price * (1 + trendBias * T);
  const bearModel = baseModel * (1 - 1.28 * tVol);  // ~90th pct downside
  const bullModel = baseModel * (1 + 1.28 * tVol);  // ~90th pct upside

  // 4. Blend analyst targets for longer horizons (analysts give 12-month targets)
  const hasAnalyst =
    !!(analystTargets?.targetMean && analystTargets.targetLow && analystTargets.targetHigh);
  const analystWeight = hasAnalyst ? Math.min(0.7, (horizon / 12) * 0.7) : 0;

  const bear = hasAnalyst
    ? bearModel * (1 - analystWeight) + analystTargets!.targetLow! * analystWeight
    : bearModel;
  const base = hasAnalyst
    ? baseModel * (1 - analystWeight) +
      (analystTargets!.targetMedian ?? analystTargets!.targetMean!) * analystWeight
    : baseModel;
  const bull = hasAnalyst
    ? bullModel * (1 - analystWeight) + analystTargets!.targetHigh! * analystWeight
    : bullModel;

  // 5. Support / resistance (approximate Fibonacci levels)
  const support = Math.max(yearLow, yearLow + yearRange * 0.236);
  const resistance = Math.min(yearHigh, yearLow + yearRange * 0.618);

  return { bear, base, bull, support, resistance, annualVol, trendBias };
}

/* ── Chart data builder ── */

function buildChartData(
  price: number,
  beta: number | null | undefined,
  yearHigh: number,
  yearLow: number,
  change: number,
  score: number,
  horizon: Horizon
) {
  const annualVol = Math.min(0.65, Math.max(0.08, Math.abs(beta ?? 1) * 0.16 + 0.05));
  const yearRange = Math.max(yearHigh - yearLow, price * 0.02);
  const posInRange = Math.min(1, Math.max(0, (price - yearLow) / yearRange));
  const trendBias =
    (posInRange - 0.5) * 0.12 +
    (change >= 0 ? 0.015 : -0.015) +
    ((score - 50) / 100) * 0.10;

  const histDays = 60;
  const { tradingDays: fwdDays } = HORIZONS.find((h) => h.value === horizon)!;
  const totalDays = histDays + fwdDays;

  // Deterministic pseudo-random historical walk
  function pseudoRand(i: number) {
    const s = Math.sin(i * 127.1 + (yearHigh || price) * 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  const histPoints: number[] = [];
  {
    const clampLow = (yearLow > 0 ? yearLow : price * 0.6) * 0.88;
    const clampHigh = (yearHigh > 0 ? yearHigh : price * 1.4) * 1.12;
    let p = price;
    for (let i = 0; i < histDays; i++) {
      histPoints.unshift(p);
      const r = pseudoRand(i + 1) * 2 - 1;
      const dailyVol = annualVol / Math.sqrt(252);
      p = Math.max(clampLow, Math.min(clampHigh, p - r * dailyVol * p - trendBias * p));
    }
    histPoints[histPoints.length - 1] = price;
  }

  // Forward projection with widening uncertainty band
  type ProjPoint = { x: number; base: number; bear: number; bull: number; bandLow: number; bandHigh: number };
  const projPoints: ProjPoint[] = [];
  for (let i = 1; i <= fwdDays; i++) {
    const tI = i / 252;
    const volI = annualVol * Math.sqrt(tI);
    const midReturn = trendBias * tI;
    const base = price * (1 + midReturn);
    const bear = base * (1 - 0.85 * volI);
    const bull = base * (1 + 0.85 * volI);
    const bandLow = Math.max(price * 0.35, base * (1 - 1.645 * volI));
    const bandHigh = base * (1 + 1.645 * volI);
    projPoints.push({ x: histDays - 1 + i, base, bear, bull, bandLow, bandHigh });
  }

  return { histPoints, projPoints, totalDays, histDays };
}

/* ── Volatility label ── */

function volLabel(annualVol: number): { text: string; color: string } {
  if (annualVol < 0.12) return { text: "Low",     color: "#10b981" };
  if (annualVol < 0.22) return { text: "Moderate", color: "#f59e0b" };
  if (annualVol < 0.35) return { text: "High",     color: "#f97316" };
  return { text: "Very High", color: "#ef4444" };
}

/* ══════════════ Main Component ══════════════ */

export default function PriceProjPanel({
  result,
  analystTargets,
}: {
  result: EvaluationResult;
  analystTargets: AnalystTargets | null;
}) {
  const [horizon, setHorizon] = useState<Horizon>(3);

  const { price, yearHigh, yearLow, beta, change, overallScore, combinedScore, ratingColor } = result;
  const score = overallScore ?? combinedScore;

  const { bear, base, bull, support, resistance, annualVol, trendBias } =
    calcProjection(price, beta, yearHigh, yearLow, change, score, analystTargets, horizon);

  const hasAnalyst = !!(analystTargets?.targetMean);
  const vLabel = volLabel(annualVol);

  const pctOf = (v: number) => ((v - price) / price) * 100;

  const bearPct  = pctOf(bear);
  const basePct  = pctOf(base);
  const bullPct  = pctOf(bull);

  // Range bar positioning
  const allPrices = [bear, base, bull, price];
  const minBound = Math.min(...allPrices) * 0.97;
  const maxBound = Math.max(...allPrices) * 1.03;
  const span = maxBound - minBound || 1;
  const toPos = (v: number) => Math.min(96, Math.max(4, ((v - minBound) / span) * 100));

  // Chart data
  const { histPoints, projPoints, totalDays, histDays } =
    buildChartData(price, beta, yearHigh, yearLow, change, score, horizon);

  const W = 100, H = 60;
  const allValues = [
    ...histPoints,
    ...projPoints.flatMap((p) => [p.bandLow, p.bandHigh]),
  ];
  const minVal = Math.min(...allValues) * 0.985;
  const maxVal = Math.max(...allValues) * 1.015;
  const vRange = maxVal - minVal || 1;
  const toX = (idx: number) => ((idx / (totalDays - 1)) * W).toFixed(3);
  const toY = (val: number) => (H - ((val - minVal) / vRange) * H).toFixed(3);

  const histPath =
    histPoints.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)} ${toY(v)}`).join(" ");

  const bandTop = projPoints.map((p) => `L${toX(p.x)} ${toY(p.bandHigh)}`).join(" ");
  const bandBot = [...projPoints].reverse().map((p) => `L${toX(p.x)} ${toY(p.bandLow)}`).join(" ");
  const bandPath = `M${toX(histDays - 1)} ${toY(price)} ${bandTop} ${bandBot} Z`;

  const baseLine =
    `M${toX(histDays - 1)} ${toY(price)} ` +
    projPoints.map((p) => `L${toX(p.x)} ${toY(p.base)}`).join(" ");
  const bearLine =
    `M${toX(histDays - 1)} ${toY(price)} ` +
    projPoints.map((p) => `L${toX(p.x)} ${toY(p.bear)}`).join(" ");
  const bullLine =
    `M${toX(histDays - 1)} ${toY(price)} ` +
    projPoints.map((p) => `L${toX(p.x)} ${toY(p.bull)}`).join(" ");

  const histColor = change >= 0 ? "#10b981" : "#ef4444";
  const projColor = score >= 55 ? "#10b981" : score >= 35 ? "#f59e0b" : "#ef4444";

  const nowPct = ((histDays - 1) / (totalDays - 1)) * 100;

  const scenariosData = [
    { key: "bear", label: "Bear",  price: bear,  pct: bearPct,  color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.16)"  },
    { key: "base", label: "Base",  price: base,  pct: basePct,  color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.16)" },
    { key: "bull", label: "Bull",  price: bull,  pct: bullPct,  color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.16)" },
  ];

  const horizonLabel = HORIZONS.find((h) => h.value === horizon)?.label ?? "3M";

  return (
    <div className="card rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="section-label">Price Outlook & Projection</div>
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-mono px-2 py-0.5 rounded"
            style={{
              background: "rgba(255,255,255,0.03)",
              color: "var(--text-dim)",
              border: "1px solid var(--border)",
            }}
          >
            {hasAnalyst ? "Analyst Blended" : "Vol Model"}
          </span>
          {/* Volatility badge */}
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded"
            style={{
              background: vLabel.color + "12",
              color: vLabel.color,
              border: `1px solid ${vLabel.color}22`,
            }}
          >
            {vLabel.text} Vol
          </span>
        </div>
      </div>

      {/* Time Horizon Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider mr-1" style={{ color: "var(--text-dim)" }}>
          Horizon
        </span>
        {HORIZONS.map((h) => (
          <button
            key={h.value}
            type="button"
            onClick={() => setHorizon(h.value)}
            className="px-3 py-1 rounded-md text-[11px] font-bold font-mono transition-all duration-150"
            style={{
              background: horizon === h.value ? ratingColor + "15" : "var(--bg-elevated)",
              color: horizon === h.value ? ratingColor : "var(--text-muted)",
              border: `1px solid ${horizon === h.value ? ratingColor + "40" : "var(--border)"}`,
              cursor: "pointer",
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Scenario Tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        {scenariosData.map((s) => (
          <div
            key={s.key}
            className="rounded-xl p-3.5"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>
              {s.label} — {horizonLabel}
            </div>
            <div className="text-[17px] font-black font-mono" style={{ color: "var(--text)" }}>
              ${s.price.toFixed(0)}
            </div>
            <div
              className="text-[12px] font-bold font-mono mt-0.5"
              style={{ color: s.pct < 0 ? "#ef4444" : "#10b981" }}
            >
              {s.pct >= 0 ? "+" : ""}
              {s.pct.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Range bar with markers */}
      <div className="relative pt-1">
        <div className="relative h-2 rounded-full" style={{ background: "var(--border)" }}>
          {/* Gradient fill */}
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${toPos(bear)}%`,
              width: `${Math.max(0, toPos(bull) - toPos(bear))}%`,
              background: "linear-gradient(90deg, #ef4444, #f59e0b 50%, #4ade80)",
              opacity: 0.4,
            }}
          />
          {/* Scenario ticks */}
          {scenariosData.map((s) => (
            <div
              key={s.key}
              className="absolute top-0 w-px h-2"
              style={{ left: `${toPos(s.price)}%`, background: s.color }}
            />
          ))}
          {/* Current price dot */}
          <div
            className="absolute -top-1"
            style={{ left: `${toPos(price)}%`, transform: "translateX(-50%)" }}
          >
            <div
              className="w-4 h-4 rounded-full border-2"
              style={{
                background: "var(--accent)",
                borderColor: "var(--bg)",
                boxShadow: "0 0 10px rgba(0,191,165,0.55)",
              }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-3 text-[9px] font-mono">
          <span style={{ color: "#ef4444" }}>Bear ${bear.toFixed(0)}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            <span style={{ color: "var(--text-secondary)" }}>Now ${price.toFixed(2)}</span>
          </div>
          <span style={{ color: "#4ade80" }}>Bull ${bull.toFixed(0)}</span>
        </div>
      </div>

      {/* Support / Resistance */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div
          className="rounded-lg p-3 text-center"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#ef4444" }}>
            Est. Support
          </div>
          <div className="text-[15px] font-black font-mono" style={{ color: "var(--text)" }}>
            ${support.toFixed(2)}
          </div>
          <div className="text-[9px] mt-0.5 font-mono" style={{ color: "var(--text-dim)" }}>
            {(((support - price) / price) * 100).toFixed(1)}%
          </div>
        </div>
        <div
          className="rounded-lg p-3 text-center"
          style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)" }}
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#4ade80" }}>
            Est. Resistance
          </div>
          <div className="text-[15px] font-black font-mono" style={{ color: "var(--text)" }}>
            ${resistance.toFixed(2)}
          </div>
          <div className="text-[9px] mt-0.5 font-mono" style={{ color: "var(--text-dim)" }}>
            {(((resistance - price) / price) * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Projection Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>
            {horizonLabel} Price Projection
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: histColor }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Historical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm opacity-30" style={{ background: projColor }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>95% Range</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: projColor, opacity: 0.8 }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Base</span>
            </div>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ overflow: "visible", display: "block" }}
          preserveAspectRatio="none"
        >
          {/* Now divider */}
          <line
            x1={`${nowPct}`} y1="0"
            x2={`${nowPct}`} y2={H}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.4"
            strokeDasharray="1.2,0.8"
          />
          {/* Uncertainty band */}
          <path d={bandPath} fill={projColor} fillOpacity="0.08" />
          {/* Bear/bull outer guides */}
          <path d={bearLine} fill="none" stroke="#ef4444" strokeWidth="0.4" strokeDasharray="1,1" opacity="0.45" />
          <path d={bullLine} fill="none" stroke="#4ade80" strokeWidth="0.4" strokeDasharray="1,1" opacity="0.45" />
          {/* Base midline */}
          <path d={baseLine} fill="none" stroke={projColor} strokeWidth="0.6" strokeDasharray="1.5,0.8" opacity="0.9" />
          {/* Historical line */}
          <path d={histPath} fill="none" stroke={histColor} strokeWidth="0.65" />
          {/* Current price dot */}
          <circle cx={`${nowPct}`} cy={toY(price)} r="1.1" fill="var(--accent)" />
        </svg>

        <div className="flex justify-between mt-1.5 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          <span>60d ago</span>
          <span style={{ color: "var(--accent)" }}>Now</span>
          <span>+{horizonLabel}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-center">
          <div className="text-[9px] mb-1" style={{ color: "var(--text-dim)" }}>Current</div>
          <div className="text-sm font-black font-mono" style={{ color: "var(--text)" }}>
            ${price.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] mb-1" style={{ color: "var(--text-dim)" }}>Base {horizonLabel}</div>
          <div className="text-sm font-black font-mono" style={{ color: projColor }}>
            ${base.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[9px] mb-1" style={{ color: "var(--text-dim)" }}>Expected Δ</div>
          <div
            className="text-sm font-black font-mono"
            style={{ color: basePct >= 0 ? "#10b981" : "#ef4444" }}
          >
            {basePct >= 0 ? "+" : ""}{basePct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Methodology note */}
      <div className="text-[10px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        {hasAnalyst
          ? `Model blends beta-adjusted volatility (σ≈${(annualVol * 100).toFixed(0)}% annual) with analyst consensus targets. ${horizon < 12 ? "Shorter horizons weight the vol model more heavily." : "1Y horizon applies full analyst blending."}`
          : `Beta-adjusted volatility model (σ≈${(annualVol * 100).toFixed(0)}% annual). Trend bias derived from 52-week position, momentum, and score. Illustrative only — not investment advice.`
        }
      </div>
    </div>
  );
}
