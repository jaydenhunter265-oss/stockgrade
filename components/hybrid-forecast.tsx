"use client";

import { useState, useEffect } from "react";
import type { EvaluationResult } from "@/lib/types";

/* ══════════════════ Types ══════════════════ */

interface AnalystTargets {
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
  numberOfAnalysts: number | null;
}

interface TechData {
  rsi: number | null;
  rsiSignal: "overbought" | "oversold" | "neutral";
  macd: { macd: number; signal: number; hist: number } | null;
  macdSignal: "bullish" | "bearish" | "neutral";
  error?: string;
}

interface ForecastPoint {
  targetPrice: number;
  highEstimate: number;
  lowEstimate: number;
  expectedReturnPercent: number;
}

interface HybridForecastOutput {
  forecast3Month: ForecastPoint;
  forecast1Year: ForecastPoint;
  analystConsensus: {
    avgTarget: number | null;
    highTarget: number | null;
    lowTarget: number | null;
    analystCount: number | null;
  };
  technicalSummary: {
    trendScore: number;
    trendDirection: "Bullish" | "Bearish" | "Neutral";
    momentumSignal: string;
  };
}

/* ══════════════════ Forecast Engine ══════════════════ */

function computeHybridForecast(
  result: EvaluationResult,
  analystTargets: AnalystTargets | null,
  techData: TechData | null
): HybridForecastOutput {
  const price = result.price;
  const beta = result.beta ?? 1;
  const yearHigh = result.yearHigh;
  const yearLow = result.yearLow;
  const changePercent = result.changePercent ?? 0;

  /* ── Step 1: Analyst target baseline ── */
  const hasAnalyst = !!(
    analystTargets?.targetMean &&
    analystTargets.targetHigh &&
    analystTargets.targetLow
  );
  const analystBaseline = hasAnalyst ? analystTargets!.targetMean! : price;
  const analystRangeHigh = hasAnalyst ? analystTargets!.targetHigh! : price * 1.15;
  const analystRangeLow = hasAnalyst ? analystTargets!.targetLow! : price * 0.85;

  /* ── Step 2: Technical trend score (-3 to +4) ──
   *
   * +1 if price > 50 MA
   * +1 if 50 MA > 200 MA  (golden cross — proxy: both above their respective MAs)
   * +1 if RSI between 50–70
   * +1 if MACD bullish
   * -1 if RSI > 75
   * -1 if price < 200 MA
   */
  let trendScore = 0;

  // SMA signals: parsed from technicalScore bullets written by the evaluator
  const techBullets = result.technicalScore?.bullets ?? [];
  const sma50Bullet = techBullets.find(
    (b) => b.text.toLowerCase().includes("50-day")
  );
  const sma200Bullet = techBullets.find(
    (b) => b.text.toLowerCase().includes("200-day")
  );

  if (sma50Bullet?.sentiment === "positive") trendScore += 1;
  // Golden-cross proxy: both price > 50 MA and price > 200 MA implies 50 MA likely above 200 MA
  if (
    sma50Bullet?.sentiment === "positive" &&
    sma200Bullet?.sentiment === "positive"
  )
    trendScore += 1;
  if (sma200Bullet?.sentiment === "negative") trendScore -= 1;

  // RSI signal
  const rsi = techData?.rsi ?? null;
  if (rsi !== null) {
    if (rsi >= 50 && rsi <= 70) trendScore += 1;
    if (rsi > 75) trendScore -= 1;
  }

  // MACD signal
  if (techData?.macdSignal === "bullish") trendScore += 1;

  // Clamp to spec range
  trendScore = Math.max(-3, Math.min(4, trendScore));

  /* ── Step 3: Technical price projection ──
   *
   * trendProjection = currentPrice * (1 + trendSlope * timeFactor)
   *
   * trendSlope is derived from:
   *   – position in 52-week range (posInRange)
   *   – recent daily change direction
   *   – normalised trend score
   */
  const yearRange = Math.max(yearHigh - yearLow, price * 0.02);
  const posInRange = Math.min(1, Math.max(0, (price - yearLow) / yearRange));

  const trendSlope =
    (posInRange - 0.5) * 0.12 +
    (changePercent >= 0 ? 0.015 : -0.015) +
    (trendScore / 4) * 0.08;

  // timeFactor: 0.25 for 3M, 1.0 for 1Y
  const proj3M = price * (1 + trendSlope * 0.25);
  const proj1Y = price * (1 + trendSlope * 1.0);

  /* ── Step 4: Hybrid blend ── */
  const wAnalyst = 0.6;
  const wTechnical = 0.4;

  const hybrid3M = hasAnalyst
    ? analystBaseline * wAnalyst + proj3M * wTechnical
    : proj3M;
  const hybrid1Y = hasAnalyst
    ? analystBaseline * wAnalyst + proj1Y * wTechnical
    : proj1Y;

  /* ── Step 5: Forecast range via volatility ── */
  const annualVol = Math.min(
    0.65,
    Math.max(0.08, Math.abs(beta) * 0.16 + 0.05)
  );
  const vol3M = annualVol * Math.sqrt(0.25);
  const vol1Y = annualVol * Math.sqrt(1.0);

  /* ── Analyst range also informs the high/low for the hybrid forecast ── */
  const high3M = hasAnalyst
    ? analystRangeHigh * wAnalyst + hybrid3M * (1 + vol3M) * wTechnical
    : hybrid3M * (1 + vol3M);
  const low3M = hasAnalyst
    ? analystRangeLow * wAnalyst + hybrid3M * (1 - vol3M) * wTechnical
    : hybrid3M * (1 - vol3M);

  const high1Y = hasAnalyst
    ? analystRangeHigh * wAnalyst + hybrid1Y * (1 + vol1Y) * wTechnical
    : hybrid1Y * (1 + vol1Y);
  const low1Y = hasAnalyst
    ? analystRangeLow * wAnalyst + hybrid1Y * (1 - vol1Y) * wTechnical
    : hybrid1Y * (1 - vol1Y);

  /* ── Technical summary labels ── */
  const trendDirection: "Bullish" | "Bearish" | "Neutral" =
    trendScore >= 2 ? "Bullish" : trendScore <= -1 ? "Bearish" : "Neutral";

  const momentumSignal =
    techData?.macdSignal === "bullish" && rsi !== null && rsi > 50
      ? "Strong Momentum"
      : techData?.macdSignal === "bearish" && rsi !== null && rsi < 50
      ? "Weak Momentum"
      : techData === null
      ? "Awaiting Data"
      : "Mixed Signals";

  return {
    forecast3Month: {
      targetPrice: hybrid3M,
      highEstimate: high3M,
      lowEstimate: low3M,
      expectedReturnPercent: ((hybrid3M - price) / price) * 100,
    },
    forecast1Year: {
      targetPrice: hybrid1Y,
      highEstimate: high1Y,
      lowEstimate: low1Y,
      expectedReturnPercent: ((hybrid1Y - price) / price) * 100,
    },
    analystConsensus: {
      avgTarget: analystTargets?.targetMean ?? null,
      highTarget: analystTargets?.targetHigh ?? null,
      lowTarget: analystTargets?.targetLow ?? null,
      analystCount: analystTargets?.numberOfAnalysts ?? null,
    },
    technicalSummary: {
      trendScore,
      trendDirection,
      momentumSignal,
    },
  };
}

/* ══════════════════ Cone Projection Chart ══════════════════ */

function ConeForecastChart({
  price,
  forecast3M,
  forecast1Y,
}: {
  price: number;
  forecast3M: ForecastPoint;
  forecast1Y: ForecastPoint;
}) {
  const W = 440;
  const H = 185;
  const PL = 60; // left padding (y-axis labels)
  const PR = 16;
  const PT = 18;
  const PB = 30; // bottom padding (x-axis labels)

  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  // X positions: Now → 3M (28% of timeline) → 1Y (100%)
  const x0 = PL;
  const x1 = PL + chartW * 0.28;
  const x2 = PL + chartW;

  // Y range — extend slightly beyond min/max for breathing room
  const allPrices = [
    price,
    forecast3M.highEstimate,
    forecast3M.lowEstimate,
    forecast3M.targetPrice,
    forecast1Y.highEstimate,
    forecast1Y.lowEstimate,
    forecast1Y.targetPrice,
  ];
  const minP = Math.min(...allPrices) * 0.955;
  const maxP = Math.max(...allPrices) * 1.045;
  const priceRange = maxP - minP || 1;

  const yOf = (p: number): number =>
    PT + chartH * (1 - (p - minP) / priceRange);

  const yCur = yOf(price);
  const yT3M = yOf(forecast3M.targetPrice);
  const yH3M = yOf(forecast3M.highEstimate);
  const yL3M = yOf(forecast3M.lowEstimate);
  const yT1Y = yOf(forecast1Y.targetPrice);
  const yH1Y = yOf(forecast1Y.highEstimate);
  const yL1Y = yOf(forecast1Y.lowEstimate);

  const pts = (...pairs: [number, number][]) =>
    pairs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // Y-axis reference lines (low, mid, high)
  const midP = (minP + maxP) / 2;
  const gridPrices = [minP, midP, maxP];

  // Price label formatter
  const fmt = (p: number) =>
    `$${p.toFixed(p >= 1000 ? 0 : p >= 100 ? 1 : 2)}`;

  // Keep dot labels from clipping at top/bottom
  const safeY = (y: number, offset = -9) =>
    Math.min(PT + chartH - 4, Math.max(PT + 10, y + offset));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxHeight: 200, display: "block" }}
      aria-label="Hybrid forecast cone chart"
    >
      {/* ── Y-axis grid ── */}
      {gridPrices.map((p, i) => {
        const y = yOf(p);
        return (
          <g key={i}>
            <line
              x1={PL}
              y1={y}
              x2={W - PR}
              y2={y}
              stroke="rgba(255,255,255,0.055)"
              strokeWidth="1"
            />
            <text
              x={PL - 5}
              y={y + 3.5}
              textAnchor="end"
              fill="rgba(255,255,255,0.30)"
              fontSize="9"
              fontFamily="monospace"
            >
              {fmt(p)}
            </text>
          </g>
        );
      })}

      {/* ── Vertical time-marker lines ── */}
      <line
        x1={x1} y1={PT} x2={x1} y2={PT + chartH}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      <line
        x1={x2} y1={PT} x2={x2} y2={PT + chartH}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1"
        strokeDasharray="3,3"
      />

      {/* ── Bull zone fill (above target, green) ── */}
      <polygon
        points={pts(
          [x0, yCur],
          [x1, yT3M],
          [x2, yT1Y],
          [x2, yH1Y],
          [x1, yH3M]
        )}
        fill="rgba(16,185,129,0.10)"
      />

      {/* ── Bear zone fill (below target, red) ── */}
      <polygon
        points={pts(
          [x0, yCur],
          [x1, yT3M],
          [x2, yT1Y],
          [x2, yL1Y],
          [x1, yL3M]
        )}
        fill="rgba(239,68,68,0.08)"
      />

      {/* ── Upper bound (bull case dashed) ── */}
      <polyline
        points={pts([x0, yCur], [x1, yH3M], [x2, yH1Y])}
        fill="none"
        stroke="rgba(16,185,129,0.50)"
        strokeWidth="1"
        strokeDasharray="4,3"
        strokeLinecap="round"
      />

      {/* ── Lower bound (bear case dashed) ── */}
      <polyline
        points={pts([x0, yCur], [x1, yL3M], [x2, yL1Y])}
        fill="none"
        stroke="rgba(239,68,68,0.50)"
        strokeWidth="1"
        strokeDasharray="4,3"
        strokeLinecap="round"
      />

      {/* ── Centre / target line ── */}
      <polyline
        points={pts([x0, yCur], [x1, yT3M], [x2, yT1Y])}
        fill="none"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Today dot ── */}
      <circle cx={x0} cy={yCur} r="7" fill="rgba(255,255,255,0.10)" />
      <circle cx={x0} cy={yCur} r="3.5" fill="rgba(255,255,255,0.85)" />

      {/* ── 3M target dot + label ── */}
      <circle cx={x1} cy={yT3M} r="3" fill="rgba(255,255,255,0.75)" />
      <text
        x={x1}
        y={safeY(yT3M)}
        textAnchor="middle"
        fill="rgba(255,255,255,0.65)"
        fontSize="9"
        fontFamily="monospace"
        fontWeight="700"
      >
        {fmt(forecast3M.targetPrice)}
      </text>

      {/* ── 1Y target dot + label ── */}
      <circle cx={x2} cy={yT1Y} r="4" fill="rgba(255,255,255,0.85)" />
      <circle cx={x2} cy={yT1Y} r="8" fill="rgba(255,255,255,0.10)" />
      <text
        x={x2}
        y={safeY(yT1Y)}
        textAnchor="middle"
        fill="rgba(255,255,255,0.65)"
        fontSize="9"
        fontFamily="monospace"
        fontWeight="700"
      >
        {fmt(forecast1Y.targetPrice)}
      </text>

      {/* ── Bull case labels at far right ── */}
      <text
        x={x2 + 2}
        y={Math.min(PT + chartH - 2, yH1Y + 3)}
        textAnchor="start"
        fill="rgba(16,185,129,0.65)"
        fontSize="8"
        fontFamily="monospace"
      >
        {fmt(forecast1Y.highEstimate)}
      </text>
      <text
        x={x2 + 2}
        y={Math.max(PT + 8, yL1Y + 3)}
        textAnchor="start"
        fill="rgba(239,68,68,0.65)"
        fontSize="8"
        fontFamily="monospace"
      >
        {fmt(forecast1Y.lowEstimate)}
      </text>

      {/* ── X-axis time labels ── */}
      <text
        x={x0}
        y={H - 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.30)"
        fontSize="9"
        fontFamily="monospace"
      >
        Now
      </text>
      <text
        x={x1}
        y={H - 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.30)"
        fontSize="9"
        fontFamily="monospace"
      >
        3M
      </text>
      <text
        x={x2}
        y={H - 8}
        textAnchor="middle"
        fill="rgba(255,255,255,0.30)"
        fontSize="9"
        fontFamily="monospace"
      >
        1Y
      </text>
    </svg>
  );
}

/* ══════════════════ Forecast Card ══════════════════ */

function ForecastCard({
  label,
  forecast,
  currentPrice,
}: {
  label: string;
  forecast: ForecastPoint;
  currentPrice: number;
}) {
  const ret = forecast.expectedReturnPercent;
  const isPos = ret >= 0;
  const retColor = isPos ? "#10b981" : "#ef4444";

  // Range bar geometry
  const allVals = [forecast.lowEstimate, forecast.targetPrice, forecast.highEstimate, currentPrice];
  const rangeMin = Math.min(...allVals) * 0.97;
  const rangeMax = Math.max(...allVals) * 1.03;
  const totalRange = rangeMax - rangeMin || 1;
  const pctOf = (v: number) => ((v - rangeMin) / totalRange) * 100;
  const pctLow = pctOf(forecast.lowEstimate);
  const pctTarget = pctOf(forecast.targetPrice);
  const pctHigh = pctOf(forecast.highEstimate);

  return (
    <div
      className="rounded-xl p-4 flex-1 min-w-0"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-3"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>

      {/* Target price + return */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-[20px] font-black font-mono leading-none"
          style={{ color: "var(--text)" }}
        >
          ${forecast.targetPrice.toFixed(2)}
        </span>
        <span className="text-[12px] font-bold font-mono" style={{ color: retColor }}>
          {isPos ? "+" : ""}
          {ret.toFixed(1)}%
        </span>
      </div>

      {/* Bull / Bear estimates */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: "#10b981" }}
          >
            Bull Case
          </span>
          <span className="text-[11px] font-mono font-bold" style={{ color: "#10b981" }}>
            ${forecast.highEstimate.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: "#ef4444" }}
          >
            Bear Case
          </span>
          <span className="text-[11px] font-mono font-bold" style={{ color: "#ef4444" }}>
            ${forecast.lowEstimate.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Range bar: low ←→ high, dot = target */}
      <div
        className="relative h-1.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute h-full rounded-full"
          style={{
            left: `${pctLow}%`,
            width: `${Math.max(0, pctHigh - pctLow)}%`,
            background:
              "linear-gradient(90deg, rgba(239,68,68,0.55), rgba(16,185,129,0.55))",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ left: `calc(${pctTarget}% - 4px)`, background: "white" }}
        />
      </div>

      {/* Current price vs range context */}
      <div
        className="mt-2 text-[9px] font-mono"
        style={{ color: "var(--text-dim)" }}
      >
        Current: ${currentPrice.toFixed(2)}
      </div>
    </div>
  );
}

/* ══════════════════ Trend Score Bar ══════════════════ */

function TrendScoreBar({ score }: { score: number }) {
  // Spec range: -3 to +4  → map to 0–100%
  const pct = ((score + 3) / 7) * 100;
  const color =
    score >= 2 ? "#10b981" : score <= -1 ? "#ef4444" : "#f59e0b";

  return (
    <div>
      <div
        className="flex justify-between text-[9px] font-mono mb-1.5"
        style={{ color: "var(--text-dim)" }}
      >
        <span>Bearish</span>
        <span className="font-bold" style={{ color }}>
          {score > 0 ? `+${score}` : score} / 4
        </span>
        <span>Bullish</span>
      </div>
      <div
        className="relative h-1.5 rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute h-full rounded-full"
          style={{
            width: `${Math.max(2, pct)}%`,
            background: "linear-gradient(90deg, #ef4444, #f59e0b, #10b981)",
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{
            left: `calc(${Math.max(2, pct)}% - 4px)`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════ Main Component ══════════════════ */

export default function HybridForecast({
  result,
  analystTargets,
}: {
  result: EvaluationResult;
  analystTargets: AnalystTargets | null;
}) {
  const [techData, setTechData] = useState<TechData | null>(null);
  const [techLoading, setTechLoading] = useState(true);

  useEffect(() => {
    setTechLoading(true);
    setTechData(null);
    fetch(`/api/technicals?ticker=${result.ticker}`)
      .then((r) => r.json())
      .then((d: TechData) => setTechData(d.error ? null : d))
      .catch(() => setTechData(null))
      .finally(() => setTechLoading(false));
  }, [result.ticker]);

  // Compute forecast — uses null techData while loading (graceful degradation)
  const forecast = computeHybridForecast(
    result,
    analystTargets,
    techLoading ? null : techData
  );

  const { forecast3Month, forecast1Year, analystConsensus, technicalSummary } =
    forecast;
  const { trendScore, trendDirection, momentumSignal } = technicalSummary;

  const dirColor =
    trendDirection === "Bullish"
      ? "#10b981"
      : trendDirection === "Bearish"
      ? "#ef4444"
      : "#f59e0b";

  const momColor =
    momentumSignal === "Strong Momentum"
      ? "#10b981"
      : momentumSignal === "Weak Momentum"
      ? "#ef4444"
      : "#f59e0b";

  return (
    <div className="card rounded-xl p-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="section-label">Hybrid Forecast</div>
        <div className="flex items-center gap-2">
          {analystConsensus.analystCount && (
            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-dim)" }}
            >
              {analystConsensus.analystCount} analyst
              {analystConsensus.analystCount > 1 ? "s" : ""}
            </span>
          )}
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              background: dirColor + "18",
              color: dirColor,
              border: `1px solid ${dirColor}30`,
            }}
          >
            {techLoading ? "Loading…" : trendDirection}
          </span>
        </div>
      </div>

      {/* ── Forecast cards ── */}
      {techLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="shimmer rounded-xl h-36" />
          <div className="shimmer rounded-xl h-36" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <ForecastCard
            label="3 Month Forecast"
            forecast={forecast3Month}
            currentPrice={result.price}
          />
          <ForecastCard
            label="1 Year Forecast"
            forecast={forecast1Year}
            currentPrice={result.price}
          />
        </div>
      )}

      {/* ── Cone projection chart ── */}
      {techLoading ? (
        <div className="shimmer rounded-xl h-48 mb-4" />
      ) : (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-3"
            style={{ color: "var(--text-dim)" }}
          >
            Forecast Range Projection
          </div>
          <ConeForecastChart
            price={result.price}
            forecast3M={forecast3Month}
            forecast1Y={forecast1Year}
          />
        </div>
      )}

      {/* ── Analyst consensus + technical summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Analyst consensus */}
        <div
          className="rounded-xl p-3.5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-2.5"
            style={{ color: "var(--text-muted)" }}
          >
            Analyst Consensus
          </div>
          <div className="space-y-1.5">
            {(
              [
                { label: "Avg Target", value: analystConsensus.avgTarget },
                { label: "High Target", value: analystConsensus.highTarget },
                { label: "Low Target", value: analystConsensus.lowTarget },
              ] as { label: string; value: number | null }[]
            ).map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span
                  className="text-[9px] font-mono"
                  style={{ color: "var(--text-dim)" }}
                >
                  {label}
                </span>
                <span
                  className="text-[11px] font-mono font-bold"
                  style={{ color: "var(--text)" }}
                >
                  {value ? `$${value.toFixed(2)}` : "—"}
                </span>
              </div>
            ))}
            {analystConsensus.analystCount && (
              <div className="flex justify-between items-center pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
                  Analysts
                </span>
                <span className="text-[11px] font-mono font-bold" style={{ color: "var(--text)" }}>
                  {analystConsensus.analystCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Technical summary */}
        <div
          className="rounded-xl p-3.5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-2.5"
            style={{ color: "var(--text-muted)" }}
          >
            Technical Summary
          </div>
          <div className="space-y-3">
            {techLoading ? (
              <div className="shimmer rounded h-4 w-full" />
            ) : (
              <TrendScoreBar score={trendScore} />
            )}
            <div className="flex justify-between items-center">
              <span
                className="text-[9px] font-mono"
                style={{ color: "var(--text-dim)" }}
              >
                Trend Direction
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: dirColor }}
              >
                {trendDirection}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span
                className="text-[9px] font-mono"
                style={{ color: "var(--text-dim)" }}
              >
                Momentum Signal
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: momColor }}
              >
                {momentumSignal}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Method footnote ── */}
      <div
        className="mt-3.5 text-[9px] font-mono text-center"
        style={{ color: "var(--text-dim)" }}
      >
        Analyst consensus (60%) + Technical trend (40%) · Volatility-adjusted range
        {!analystTargets && (
          <span className="ml-1 opacity-70">· No analyst data — technical projection only</span>
        )}
      </div>
    </div>
  );
}
