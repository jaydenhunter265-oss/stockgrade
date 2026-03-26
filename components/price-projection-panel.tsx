"use client";

import { useState, useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  AreaSeries,
  LineSeries,
  LineStyle,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { EvaluationResult } from "@/lib/types";

interface ChartQuote {
  date: string;
  close: number;
}

/* ── Types ── */

interface AnalystTargets {
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
}

// 5 = 5 trading days; others = months
type Horizon = 5 | 1 | 3 | 6 | 12;

// Maps horizon value → fraction of a trading year
const T_YEARS: Record<Horizon, number> = {
  5:  5  / 252,
  1:  1  / 12,
  3:  3  / 12,
  6:  6  / 12,
  12: 12 / 12,
};

const HORIZONS: { value: Horizon; label: string; tradingDays: number }[] = [
  { value: 5,  label: "5D",  tradingDays: 5   },
  { value: 1,  label: "1M",  tradingDays: 21  },
  { value: 3,  label: "3M",  tradingDays: 63  },
  { value: 6,  label: "6M",  tradingDays: 126 },
  { value: 12, label: "1Y",  tradingDays: 252 },
];

type SeriesPoint = { time: UTCTimestamp; value: number };

/* ── Projection price math ── */

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
  const annualVol = Math.min(0.65, Math.max(0.08, Math.abs(beta ?? 1) * 0.16 + 0.05));
  const yearRange = Math.max(yearHigh - yearLow, price * 0.02);
  const posInRange = Math.min(1, Math.max(0, (price - yearLow) / yearRange));
  const trendBias =
    (posInRange - 0.5) * 0.12 +
    (change >= 0 ? 0.015 : -0.015) +
    ((score - 50) / 100) * 0.10;

  const T = T_YEARS[horizon];
  const tVol = annualVol * Math.sqrt(T);
  const baseModel = price * (1 + trendBias * T);
  const bearModel = baseModel * (1 - 1.28 * tVol);
  const bullModel = baseModel * (1 + 1.28 * tVol);

  const hasAnalyst =
    !!(analystTargets?.targetMean && analystTargets.targetLow && analystTargets.targetHigh);
  // Analyst targets are 12-month consensus — weight scales with horizon
  const analystWeight = hasAnalyst ? Math.min(0.70, T * 0.70) : 0;

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

  // Support / resistance (Fibonacci levels on 52-week range)
  const support = Math.max(yearLow, yearLow + yearRange * 0.236);
  const resistance = Math.min(yearHigh, yearLow + yearRange * 0.618);

  return { bear, base, bull, support, resistance, annualVol, trendBias };
}

/* ── Probability model ──
 *
 * Computes bear / base / bull scenario probabilities by combining five
 * signals — each weighted differently per horizon:
 *
 *  Signal       Short (5D)  Medium (3M)  Long (1Y)
 *  ─────────────────────────────────────────────────
 *  Technical      high        mid          low     ← pillar score + 52w position
 *  Fundamental    low         mid          high    ← pillar score
 *  Sentiment      high        mid          low     ← news/event sentiment pillar
 *  Momentum       high        mid          low     ← recent % change
 *  Analyst        none        mid          high    ← consensus vs current price
 *
 * bullBias (−1 → +1) shifts the bull/bear split of the non-base probability.
 * Base probability rises with horizon (fundamentals take time to assert).
 * High beta / high riskLevel compress the base, widening the tails.
 */

type ProbWeights = [number, number, number, number, number]; // [tech, fund, sent, mom, analyst]

const PROB_WEIGHTS: Record<Horizon, ProbWeights> = {
  5:  [0.42, 0.06, 0.28, 0.20, 0.04],
  1:  [0.36, 0.14, 0.22, 0.18, 0.10],
  3:  [0.26, 0.22, 0.18, 0.16, 0.18],
  6:  [0.18, 0.30, 0.15, 0.12, 0.25],
  12: [0.10, 0.35, 0.12, 0.08, 0.35],
};

const BASE_PROB_BY_HORIZON: Record<Horizon, number> = {
  5: 28, 1: 35, 3: 42, 6: 48, 12: 52,
};

function calcProbabilities(
  price: number,
  beta: number | null | undefined,
  yearHigh: number,
  yearLow: number,
  changePercent: number,
  analystTargets: AnalystTargets | null,
  horizon: Horizon,
  fundPct: number,    // fundamentalsScore.percentage  (0–100)
  techPct: number,    // technicalScore.percentage      (0–100)
  sentPct: number,    // sentimentScore.percentage      (0–100)
  riskLevel: string,
): { bearProb: number; baseProb: number; bullProb: number } {

  // ── Individual signals (−1..+1 = bearish..bullish) ──

  // Technical: pillar score + 52-week mean-reversion
  const yearRange = Math.max(yearHigh - yearLow, price * 0.02);
  const posInRange = Math.min(1, Math.max(0, (price - yearLow) / yearRange));
  const techPillarSig  = (techPct - 50) / 50;
  const rangeRevSig    = (0.5 - posInRange);            // near low → bullish
  const techSignal     = techPillarSig * 0.65 + rangeRevSig * 0.60;

  // Fundamental pillar
  const fundSignal = (fundPct - 50) / 50;

  // Sentiment / news / upcoming-events pillar
  const sentSignal = (sentPct - 50) / 50;

  // Momentum: tanh keeps signal bounded regardless of change magnitude
  const momSignal = Math.tanh(changePercent / 4);

  // Analyst consensus vs current price
  let analystSignal = 0;
  if (analystTargets?.targetMean && analystTargets.targetMean > 0) {
    const upside = (analystTargets.targetMean - price) / price;
    analystSignal = Math.tanh(upside * 3); // +20% upside → tanh(0.6) ≈ 0.54
  }

  // ── Weighted combination ──
  const [wt, wf, ws, wm, wa] = PROB_WEIGHTS[horizon];
  const rawBias =
    techSignal    * wt +
    fundSignal    * wf +
    sentSignal    * ws +
    momSignal     * wm +
    analystSignal * wa;

  // Clamp — prevents extreme signal from dominating completely
  const bullBias = Math.max(-0.80, Math.min(0.80, rawBias));

  // ── Base probability (how likely is the "middle" scenario) ──
  let basePct = BASE_PROB_BY_HORIZON[horizon];

  const b = Math.abs(beta ?? 1);
  if (b > 2.0)      basePct -= 7;
  else if (b > 1.5) basePct -= 4;
  else if (b < 0.6) basePct += 4;

  if (riskLevel === "High")     basePct -= 4;
  else if (riskLevel === "Low") basePct += 3;

  basePct = Math.max(20, Math.min(62, basePct));

  // ── Split remaining between bull and bear ──
  // bullShare: 0.20 (strong bear) → 0.50 (neutral) → 0.80 (strong bull)
  const bullShare = 0.50 + bullBias * 0.375;
  const remaining = 100 - basePct;

  let bullProb = Math.round(remaining * bullShare);
  let bearProb = remaining - bullProb;

  // Enforce minimums
  bullProb = Math.max(5, bullProb);
  bearProb = Math.max(5, bearProb);

  // Renormalise to exactly 100
  const total = bullProb + bearProb + basePct;
  const finalBear = Math.round((bearProb / total) * 100);
  const finalBull = Math.round((bullProb / total) * 100);
  const finalBase = 100 - finalBear - finalBull;

  return {
    bearProb: Math.max(5, finalBear),
    baseProb: Math.max(15, finalBase),
    bullProb: Math.max(5, finalBull),
  };
}

/* ── Forward projection series builder ── */

function getTradingDays(from: Date, count: number, forward: boolean): Date[] {
  const days: Date[] = [];
  const cursor = new Date(from);
  while (days.length < count) {
    cursor.setDate(cursor.getDate() + (forward ? 1 : -1));
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
  }
  return forward ? days : days.reverse();
}

function buildProjectionSeries(
  price: number,
  horizon: Horizon,
  finalBear: number,
  finalBase: number,
  finalBull: number,
): {
  baseSeries: SeriesPoint[];
  bearSeries: SeriesPoint[];
  bullSeries: SeriesPoint[];
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const toTs = (d: Date) => Math.floor(d.getTime() / 1000) as UTCTimestamp;
  const todayTs = toTs(today);

  const { tradingDays: fwdDays } = HORIZONS.find((h) => h.value === horizon)!;
  const forwardDates = getTradingDays(today, fwdDays, true);

  const baseSeries: SeriesPoint[] = [{ time: todayTs, value: price }];
  const bearSeries: SeriesPoint[] = [{ time: todayTs, value: price }];
  const bullSeries: SeriesPoint[] = [{ time: todayTs, value: price }];

  for (let i = 0; i < forwardDates.length; i++) {
    const t = (i + 1) / fwdDays;
    const ts = toTs(forwardDates[i]);
    baseSeries.push({ time: ts, value: price + (finalBase - price) * t });
    bearSeries.push({ time: ts, value: price + (finalBear - price) * t });
    bullSeries.push({ time: ts, value: price + (finalBull - price) * t });
  }

  return { baseSeries, bearSeries, bullSeries };
}

/* ── Volatility label ── */

function volLabel(annualVol: number): { text: string; color: string } {
  if (annualVol < 0.12) return { text: "Low",      color: "#10b981" };
  if (annualVol < 0.22) return { text: "Moderate", color: "#f59e0b" };
  if (annualVol < 0.35) return { text: "High",      color: "#f97316" };
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
  const [histQuotes, setHistQuotes] = useState<ChartQuote[]>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const {
    ticker, price, yearHigh, yearLow, beta, change, changePercent,
    overallScore, combinedScore, ratingColor,
    fundamentalsScore, technicalScore, sentimentScore, riskLevel,
  } = result;
  const score = overallScore ?? combinedScore;

  const { bear, base, bull, support, resistance, annualVol } =
    calcProjection(price, beta, yearHigh, yearLow, change, score, analystTargets, horizon);

  const pillarPct = (p: typeof fundamentalsScore | undefined) =>
    p && p.maxScore > 0 ? (p.score / p.maxScore) * 100 : 50;

  const fundPct = pillarPct(fundamentalsScore);
  const techPct = pillarPct(technicalScore);
  const sentPct = pillarPct(sentimentScore);

  const { bearProb, baseProb, bullProb } = calcProbabilities(
    price, beta, yearHigh, yearLow, changePercent ?? change,
    analystTargets, horizon,
    fundPct, techPct, sentPct,
    riskLevel ?? "Moderate",
  );

  // Fetch real historical prices for the chart
  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/chart?ticker=${ticker}&range=3M`)
      .then((r) => r.json())
      .then((d) => setHistQuotes(d.quotes ?? []))
      .catch(() => setHistQuotes([]));
  }, [ticker]);

  const hasAnalyst = !!(analystTargets?.targetMean);
  const vLabel = volLabel(annualVol);

  const pctOf = (v: number) => ((v - price) / price) * 100;
  const bearPct = pctOf(bear);
  const basePct = pctOf(base);
  const bullPct = pctOf(bull);

  // Range bar positioning
  const allPrices = [bear, base, bull, price];
  const minBound = Math.min(...allPrices) * 0.97;
  const maxBound = Math.max(...allPrices) * 1.03;
  const span = maxBound - minBound || 1;
  const toPos = (v: number) => Math.min(96, Math.max(4, ((v - minBound) / span) * 100));

  const histColor = change >= 0 ? "#10b981" : "#ef4444";
  const projColor = score >= 55 ? "#10b981" : score >= 35 ? "#f59e0b" : "#ef4444";
  const horizonLabel = HORIZONS.find((h) => h.value === horizon)?.label ?? "3M";

  const scenariosData = [
    { key: "bear", label: "Bear", price: bear, pct: bearPct, prob: bearProb, color: "#ef4444", bg: "rgba(239,68,68,0.07)",   border: "rgba(239,68,68,0.16)"  },
    { key: "base", label: "Base", price: base, pct: basePct, prob: baseProb, color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.16)" },
    { key: "bull", label: "Bull", price: bull, pct: bullPct, prob: bullProb, color: "#4ade80", bg: "rgba(74,222,128,0.07)",  border: "rgba(74,222,128,0.16)" },
  ];

  /* ── Build / rebuild chart ── */
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const el = chartContainerRef.current;
    const { baseSeries, bearSeries, bullSeries } = buildProjectionSeries(
      price, horizon, bear, base, bull
    );

    const toTs = (dateStr: string) =>
      Math.floor(new Date(dateStr).getTime() / 1000) as UTCTimestamp;

    const histSeries: SeriesPoint[] = histQuotes.map((q) => ({
      time: toTs(q.date),
      value: q.close,
    }));

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.3)",
        fontFamily: "var(--font-mono), ui-monospace, Menlo, Consolas, monospace",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(255,255,255,0.2)", labelBackgroundColor: "#1a1a2e" },
        horzLine: { color: "rgba(255,255,255,0.12)", labelBackgroundColor: "#1a1a2e" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        textColor: "rgba(255,255,255,0.3)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });
    chartInstanceRef.current = chart;

    // Bear projection area (red fill = downside risk zone)
    const bearArea = chart.addSeries(AreaSeries, {
      lineColor: "#ef4444",
      topColor: "rgba(239,68,68,0.06)",
      bottomColor: "rgba(239,68,68,0.18)",
      lineWidth: 1,
      priceScaleId: "right",
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });
    bearArea.setData(bearSeries);

    // Bull projection area (green fill = upside potential zone)
    const bullArea = chart.addSeries(AreaSeries, {
      lineColor: "#4ade80",
      topColor: "rgba(74,222,128,0.18)",
      bottomColor: "rgba(74,222,128,0.03)",
      lineWidth: 1,
      priceScaleId: "right",
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });
    bullArea.setData(bullSeries);

    // Base projection line (thicker, dominant)
    const baseLine = chart.addSeries(LineSeries, {
      color: projColor,
      lineWidth: 2,
      lineStyle: LineStyle.LargeDashed,
      priceScaleId: "right",
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });
    baseLine.setData(baseSeries);

    // Historical area (real API data — drawn on top so it's never obscured)
    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: histColor,
      topColor: histColor + "28",
      bottomColor: histColor + "00",
      lineWidth: 2,
      priceScaleId: "right",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    if (histSeries.length > 0) {
      areaSeries.setData(histSeries);
    }

    // Support — green dashed line (price floor)
    areaSeries.createPriceLine({
      price: support,
      color: "rgba(74,222,128,0.65)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `S  $${support.toFixed(0)}`,
    });

    // Resistance — red dashed line (price ceiling)
    areaSeries.createPriceLine({
      price: resistance,
      color: "rgba(239,68,68,0.65)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `R  $${resistance.toFixed(0)}`,
    });

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (el && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({ width: el.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [histQuotes, price, horizon, bear, base, bull, support, resistance, histColor, projColor]);

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

      {/* Scenario Tiles with Probability */}
      <div className="grid grid-cols-3 gap-2.5">
        {scenariosData.map((s) => (
          <div
            key={s.key}
            className="rounded-xl p-3.5"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            {/* Label + probability pill */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: s.color }}>
                {s.label} — {horizonLabel}
              </div>
              <div
                className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded"
                style={{ background: s.color + "20", color: s.color, border: `1px solid ${s.color}30` }}
              >
                {s.prob}%
              </div>
            </div>
            <div className="text-[17px] font-black font-mono" style={{ color: "var(--text)" }}>
              ${s.price.toFixed(0)}
            </div>
            <div
              className="text-[12px] font-bold font-mono mt-0.5"
              style={{ color: s.pct < 0 ? "#ef4444" : "#10b981" }}
            >
              {s.pct >= 0 ? "+" : ""}{s.pct.toFixed(1)}%
            </div>
            {/* Probability progress bar */}
            <div className="mt-2.5 pt-2" style={{ borderTop: `1px solid ${s.border}` }}>
              <div
                className="h-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.prob}%`, background: s.color, opacity: 0.75 }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stacked probability distribution bar */}
      <div>
        <div className="flex justify-between mb-1.5 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          <span style={{ color: "#ef4444" }}>Bear {bearProb}%</span>
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-dim)" }}>
            Probability Distribution
          </span>
          <span style={{ color: "#4ade80" }}>Bull {bullProb}%</span>
        </div>
        <div className="flex rounded-full overflow-hidden" style={{ height: 6 }}>
          <div
            className="transition-all duration-500"
            style={{ width: `${bearProb}%`, background: "#ef4444", opacity: 0.70 }}
          />
          <div
            className="transition-all duration-500"
            style={{ width: `${baseProb}%`, background: "#f59e0b", opacity: 0.70 }}
          />
          <div
            className="transition-all duration-500"
            style={{ width: `${bullProb}%`, background: "#4ade80", opacity: 0.70 }}
          />
        </div>
        <div className="flex justify-center mt-1 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          <span style={{ color: "#f59e0b" }}>Base {baseProb}%</span>
        </div>
      </div>

      {/* Range bar with markers */}
      <div className="relative pt-1">
        <div className="relative h-2 rounded-full" style={{ background: "var(--border)" }}>
          <div
            className="absolute h-full rounded-full"
            style={{
              left: `${toPos(bear)}%`,
              width: `${Math.max(0, toPos(bull) - toPos(bear))}%`,
              background: "linear-gradient(90deg, #ef4444, #f59e0b 50%, #4ade80)",
              opacity: 0.4,
            }}
          />
          {scenariosData.map((s) => (
            <div
              key={s.key}
              className="absolute top-0 w-px h-2"
              style={{ left: `${toPos(s.price)}%`, background: s.color }}
            />
          ))}
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
          style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)" }}
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#4ade80" }}>
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
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "#ef4444" }}>
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
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="flex items-center gap-1.5">
              <div className="w-4 rounded-full" style={{ height: 2, background: histColor }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Historical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 rounded-full" style={{ height: 2, background: "#ef4444", opacity: 0.7 }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Bear</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 rounded-full" style={{ height: 2, background: projColor }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Base</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 rounded-full" style={{ height: 2, background: "#4ade80", opacity: 0.7 }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Bull</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 rounded-full" style={{ height: 2, background: "rgba(74,222,128,0.65)" }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Support</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 rounded-full" style={{ height: 2, background: "rgba(239,68,68,0.65)" }} />
              <span className="text-[9px]" style={{ color: "var(--text-dim)" }}>Resistance</span>
            </div>
          </div>
        </div>

        <div ref={chartContainerRef} className="w-full" />

        <div className="flex justify-between mt-2 text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          <span>3M ago</span>
          <span style={{ color: "var(--accent)" }}>▲ Now</span>
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

      {/* Probability factors note */}
      <div className="text-[10px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        {horizon === 5
          ? `5D probabilities weight technical score (${techPct.toFixed(0)}%), sentiment (${sentPct.toFixed(0)}%), and price momentum most heavily — fundamentals have limited short-term impact.`
          : horizon <= 1
          ? `1M probabilities blend technical signals, news sentiment, and recent momentum. Fundamental score: ${fundPct.toFixed(0)}%.${hasAnalyst ? " Analyst targets carry low weight at 1M." : ""}`
          : horizon <= 3
          ? `3M probabilities balance technical (${techPct.toFixed(0)}%), fundamental (${fundPct.toFixed(0)}%), sentiment (${sentPct.toFixed(0)}%) and momentum signals equally.${hasAnalyst ? " Analyst consensus blended." : ""}`
          : horizon <= 6
          ? `6M probabilities give increasing weight to fundamentals (${fundPct.toFixed(0)}%) and analyst targets over short-term technical signals.${hasAnalyst ? " Analyst blending applied." : ""}`
          : `1Y probabilities are primarily driven by fundamentals (${fundPct.toFixed(0)}%) and analyst consensus targets, with diminished weight on short-term technicals.${hasAnalyst ? " Full analyst blending applied." : " Vol model only — no analyst targets available."}`
        }
      </div>
    </div>
  );
}
