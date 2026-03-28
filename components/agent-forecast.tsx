"use client";

import { useState } from "react";
import type { AgentForecastOutput, ForecastScenario } from "@/lib/types";

/* ══════════════════ Helpers ══════════════════ */

function fmt(price: number) {
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function retStr(pct: number) {
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

function directionColor(dir: string): string {
  if (dir === "bullish") return "#10b981";
  if (dir === "bearish") return "#ef4444";
  return "#94a3b8";
}

function compositeColor(label: AgentForecastOutput["composite_label"]): string {
  if (label === "very_bullish") return "#10b981";
  if (label === "bullish") return "#34d399";
  if (label === "bearish") return "#f87171";
  if (label === "very_bearish") return "#ef4444";
  return "#94a3b8";
}

function labelText(label: AgentForecastOutput["composite_label"]): string {
  return label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scenarioColor(label: ForecastScenario["label"]): string {
  if (label === "Strong Bull")     return "#10b981";
  if (label === "Moderate Bull")   return "#34d399";
  if (label === "Neutral")         return "#94a3b8";
  if (label === "Bearish")         return "#f87171";
  return "#ef4444";
}

function riskColor(level: "low" | "medium" | "high"): string {
  if (level === "low")  return "#10b981";
  if (level === "high") return "#ef4444";
  return "#f59e0b";
}

/* ══════════════════ Agent Card ══════════════════ */

interface AgentCardProps {
  icon: string;
  title: string;
  badge: string;
  badgeColor: string;
  score: number;      // 0–1
  scoreColor: string;
  explanation: string;
}

function AgentCard({ icon, title, badge, badgeColor, score, scoreColor, explanation }: AgentCardProps) {
  const barPct = Math.round(score * 100);
  return (
    <div
      className="rounded-xl p-3.5 flex flex-col gap-2.5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base leading-none">{icon}</span>
          <span className="text-[12px] font-semibold text-[var(--foreground)] truncate">{title}</span>
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0"
          style={{ background: badgeColor + "20", color: badgeColor }}
        >
          {badge}
        </span>
      </div>

      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-[var(--muted-foreground)]">Strength</span>
          <span className="text-[10px] font-mono" style={{ color: scoreColor }}>{barPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barPct}%`, background: scoreColor }}
          />
        </div>
      </div>

      {/* Explanation */}
      <p className="text-[11px] leading-relaxed text-[var(--muted-foreground)] line-clamp-2">
        {explanation}
      </p>
    </div>
  );
}

/* ══════════════════ Price Target Card ══════════════════ */

function PriceTargetCard({
  label,
  price,
  current,
  color,
}: {
  label: string;
  price: number;
  current: number;
  color: string;
}) {
  const ret = ((price - current) / current) * 100;
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1.5 flex-1 min-w-0"
      style={{ background: "var(--card)", border: `1px solid ${color}30` }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
      <span className="text-[20px] font-bold leading-tight" style={{ color }}>{fmt(price)}</span>
      <span className="text-[11px]" style={{ color }}>
        {retStr(ret)} from current
      </span>
    </div>
  );
}

/* ══════════════════ Scenario Row ══════════════════ */

function ScenarioRow({ scenario }: { scenario: ForecastScenario }) {
  const color = scenarioColor(scenario.label);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-semibold" style={{ color }}>{scenario.label}</span>
          <span className="text-[10px] text-[var(--muted-foreground)]">— {scenario.description}</span>
        </div>
      </div>
      {/* Probability bar */}
      <div className="w-24 shrink-0 space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-[var(--muted-foreground)]">prob</span>
          <span className="font-mono" style={{ color }}>{scenario.probability}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${scenario.probability}%`, background: color }}
          />
        </div>
      </div>
      {/* Price target */}
      <div className="text-right shrink-0 w-20">
        <div className="text-[12px] font-mono font-semibold" style={{ color }}>
          {fmt(scenario.priceTarget)}
        </div>
        <div className="text-[10px] text-[var(--muted-foreground)]">{retStr(scenario.returnPct)}</div>
      </div>
    </div>
  );
}

/* ══════════════════ Main Component ══════════════════ */

export default function AgentForecast({
  forecast,
  currentPrice,
}: {
  forecast: AgentForecastOutput;
  currentPrice: number;
}) {
  const [scenariosOpen, setScenariosOpen] = useState(false);
  const { agents, composite_label, composite_score, confidence, annual_volatility } = forecast;
  const color = compositeColor(composite_label);

  /* Agent card definitions */
  const agentCards: AgentCardProps[] = [
    {
      icon: "📈",
      title: "Trend",
      badge: agents.trend.trend_direction,
      badgeColor: directionColor(agents.trend.trend_direction),
      score: agents.trend.trend_strength,
      scoreColor: directionColor(agents.trend.trend_direction),
      explanation: agents.trend.explanation,
    },
    {
      icon: "🏛️",
      title: "Fundamentals",
      badge: agents.fundamentals.valuation_label,
      badgeColor: agents.fundamentals.valuation_label === "undervalued" ? "#10b981"
                : agents.fundamentals.valuation_label === "overvalued"  ? "#ef4444"
                : "#94a3b8",
      score: agents.fundamentals.fundamental_score,
      scoreColor: agents.fundamentals.fundamental_score >= 0.6 ? "#34d399"
                : agents.fundamentals.fundamental_score >= 0.4 ? "#f59e0b"
                : "#f87171",
      explanation: agents.fundamentals.explanation,
    },
    {
      icon: "💬",
      title: "Sentiment",
      badge: agents.sentiment.sentiment,
      badgeColor: directionColor(agents.sentiment.sentiment),
      score: agents.sentiment.sentiment_score,
      scoreColor: directionColor(agents.sentiment.sentiment),
      explanation: agents.sentiment.explanation,
    },
    {
      icon: "🛡️",
      title: "Risk",
      badge: agents.risk.risk_level + " risk",
      badgeColor: riskColor(agents.risk.risk_level),
      // Invert: low vol = high strength
      score: 1 - agents.risk.volatility_score,
      scoreColor: riskColor(agents.risk.risk_level),
      explanation: agents.risk.explanation,
    },
    {
      icon: "🌐",
      title: "Macro",
      badge: agents.macro.macro_bias,
      badgeColor: directionColor(agents.macro.macro_bias),
      score: agents.macro.macro_score,
      scoreColor: directionColor(agents.macro.macro_bias),
      explanation: agents.macro.explanation,
    },
  ];

  return (
    <div className="card rounded-xl p-5 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold tracking-tight">Multi-Agent Forecast</h2>
          <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">
            5 independent analysts · consensus-weighted outlook
          </p>
        </div>
        <div className="text-right shrink-0">
          <div
            className="text-[13px] font-bold px-3 py-1 rounded-full"
            style={{ background: color + "18", color, border: `1px solid ${color}30` }}
          >
            {labelText(composite_label)}
          </div>
          <div className="text-[11px] text-[var(--muted-foreground)] mt-1">
            {confidence}% confidence · {(annual_volatility * 100).toFixed(0)}% ann. vol
          </div>
        </div>
      </div>

      {/* ── Composite score bar ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px]">
          <span className="text-[var(--muted-foreground)]">Composite consensus score</span>
          <span className="font-mono font-semibold" style={{ color }}>
            {Math.round(composite_score * 100)}/100
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.round(composite_score * 100)}%`, background: color }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[var(--muted-foreground)]">
          <span>Very Bearish</span>
          <span>Neutral</span>
          <span>Very Bullish</span>
        </div>
      </div>

      {/* ── Agent grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {agentCards.map((card) => (
          <AgentCard key={card.title} {...card} />
        ))}
      </div>

      {/* ── Price targets ── */}
      <div>
        <p className="text-[11px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2.5">
          12-Month Price Targets
        </p>
        <div className="flex gap-2.5">
          <PriceTargetCard label="Bear Case" price={forecast.bear_case} current={currentPrice} color="#ef4444" />
          <PriceTargetCard label="Base Case" price={forecast.base_case} current={currentPrice} color={color} />
          <PriceTargetCard label="Bull Case" price={forecast.bull_case} current={currentPrice} color="#10b981" />
        </div>
      </div>

      {/* ── Explanation ── */}
      <p className="text-[12px] leading-relaxed text-[var(--muted-foreground)] italic">
        {forecast.explanation}
      </p>

      {/* ── Scenarios (collapsible) ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <button
          onClick={() => setScenariosOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
        >
          <span className="text-[12px] font-semibold">Scenario Breakdown</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--muted-foreground)]">5 outcomes · vol-constrained</span>
            <span
              className="text-[11px] transition-transform duration-200"
              style={{ display: "inline-block", transform: scenariosOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▾
            </span>
          </div>
        </button>

        {scenariosOpen && (
          <div className="px-4 pb-2" style={{ borderTop: "1px solid var(--border)" }}>
            {forecast.scenarios.map((s) => (
              <ScenarioRow key={s.label} scenario={s} />
            ))}
            <p className="text-[10px] text-[var(--muted-foreground)] pt-2 pb-1">
              Scenarios vary inputs within volatility bounds. Probabilities reflect composite score directional bias. Not financial advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
