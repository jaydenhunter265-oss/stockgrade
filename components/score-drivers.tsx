"use client";

import type { CategoryScore } from "@/lib/types";

/* ── Driver category mapping ── */

const DRIVER_MAP: Record<string, "growth" | "valuation" | "quality" | "technical" | "sentiment"> = {
  // Growth-oriented categories
  "Growth":              "growth",
  "Revenue Growth":      "growth",
  "EPS Growth":          "growth",
  "FCF Growth":          "growth",
  "Cash Flow":           "growth",

  // Valuation-oriented categories
  "Valuation":           "valuation",
  "Value":               "valuation",

  // Quality / profitability
  "Profitability":       "quality",
  "Liquidity":           "quality",
  "Leverage":            "quality",
  "Balance Sheet":       "quality",
  "Solvency":            "quality",
  "Debt":                "quality",

  // Technical / momentum
  "Momentum":            "technical",
  "Technical":           "technical",
  "SMA Trend":           "technical",
  "Volume":              "technical",
  "Position":            "technical",
  "Price Action":        "technical",

  // Sentiment / analyst
  "Analyst Ratings":     "sentiment",
  "Analyst Sentiment":   "sentiment",
  "Insider Activity":    "sentiment",
  "Short Interest":      "sentiment",
  "Sentiment":           "sentiment",
  "ESG":                 "sentiment",

  // Catch-all
  "Risk Factors":        "quality",
  "Risk":                "quality",
};

function resolveDriver(
  categoryName: string
): "growth" | "valuation" | "quality" | "technical" | "sentiment" {
  // Exact match
  if (DRIVER_MAP[categoryName]) return DRIVER_MAP[categoryName];
  // Fuzzy substring match
  const lower = categoryName.toLowerCase();
  if (lower.includes("growth") || lower.includes("cash"))       return "growth";
  if (lower.includes("valuation") || lower.includes("value"))   return "valuation";
  if (lower.includes("profit") || lower.includes("liquid") || lower.includes("debt") || lower.includes("risk")) return "quality";
  if (lower.includes("technical") || lower.includes("momentum") || lower.includes("sma")) return "technical";
  if (lower.includes("sentiment") || lower.includes("analyst") || lower.includes("insider")) return "sentiment";
  return "quality";
}

/* ── Driver config ── */

const DRIVERS = [
  {
    key:   "growth"   as const,
    label: "Growth",
    color: "#3b82f6",
    desc:  "Revenue, EPS & cash flow growth metrics",
    icon:  "↑",
  },
  {
    key:   "valuation" as const,
    label: "Valuation",
    color: "#a78bfa",
    desc:  "P/E, P/B, EV/EBITDA and peer multiples",
    icon:  "$",
  },
  {
    key:   "quality" as const,
    label: "Quality",
    color: "#10b981",
    desc:  "Profitability, liquidity & balance sheet",
    icon:  "◎",
  },
  {
    key:   "technical" as const,
    label: "Momentum",
    color: "#f59e0b",
    desc:  "Price action, SMA trends & volume signals",
    icon:  "≈",
  },
  {
    key:   "sentiment" as const,
    label: "Sentiment",
    color: "#ec4899",
    desc:  "Analyst ratings, insider activity & short interest",
    icon:  "★",
  },
] as const;

type DriverKey = "growth" | "valuation" | "quality" | "technical" | "sentiment";

/* ══════════════ Component ══════════════ */

export default function ScoreDrivers({ categories }: { categories: CategoryScore[] }) {
  if (!categories.length) return null;

  // Aggregate signals per driver
  const driverData: Record<DriverKey, { buy: number; neutral: number; sell: number; total: number }> = {
    growth:    { buy: 0, neutral: 0, sell: 0, total: 0 },
    valuation: { buy: 0, neutral: 0, sell: 0, total: 0 },
    quality:   { buy: 0, neutral: 0, sell: 0, total: 0 },
    technical: { buy: 0, neutral: 0, sell: 0, total: 0 },
    sentiment: { buy: 0, neutral: 0, sell: 0, total: 0 },
  };

  for (const cat of categories) {
    const driver = resolveDriver(cat.name);
    for (const metric of cat.metrics) {
      if (metric.value === "N/A") continue;
      driverData[driver].total += 1;
      if (metric.score === 1)  driverData[driver].buy     += 1;
      if (metric.score === 0)  driverData[driver].neutral += 1;
      if (metric.score === -1) driverData[driver].sell    += 1;
    }
  }

  // Score each driver: buy=+1, neutral=0, sell=-1, normalized to 0-100
  function driverScore(d: typeof driverData[DriverKey]) {
    if (d.total === 0) return null;
    const raw = (d.buy - d.sell) / d.total; // -1 to +1
    return Math.round(((raw + 1) / 2) * 100); // 0 to 100
  }

  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="section-label">What Drives This Score</div>
        <span className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
          Signal contribution
        </span>
      </div>

      <div className="space-y-4">
        {DRIVERS.map((driver) => {
          const d = driverData[driver.key];
          const s = driverScore(d);
          if (d.total === 0) return null;

          const barW = s ?? 50;
          const barColor = barW >= 60 ? driver.color : barW >= 40 ? "#f59e0b" : "#ef4444";
          const netSignal = d.buy - d.sell;
          const netLabel = netSignal > 0 ? `+${netSignal}` : String(netSignal);
          const netColor = netSignal > 0 ? "#10b981" : netSignal < 0 ? "#ef4444" : "var(--text-muted)";

          const impactLabel =
            barW >= 65 ? "Positive" :
            barW >= 50 ? "Slight +" :
            barW >= 35 ? "Slight −" : "Negative";
          const impactColor =
            barW >= 65 ? "#10b981" :
            barW >= 50 ? "#4ade80" :
            barW >= 35 ? "#f97316" : "#ef4444";

          return (
            <div key={driver.key}>
              <div className="flex items-center gap-3 mb-1.5">
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
                  style={{ background: driver.color + "12", color: driver.color }}
                >
                  {driver.icon}
                </div>

                {/* Label + desc */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold" style={{ color: "var(--text)" }}>
                      {driver.label}
                    </span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: impactColor + "12", color: impactColor }}
                    >
                      {impactLabel}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                    {driver.desc}
                  </span>
                </div>

                {/* Signal count */}
                <div className="text-right flex-shrink-0">
                  <div className="text-[13px] font-black font-mono" style={{ color: netColor }}>
                    {netLabel}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: "var(--text-dim)" }}>
                    net
                  </div>
                </div>
              </div>

              {/* Progress bar with segments */}
              <div className="flex items-center gap-2 ml-10">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div
                    className="h-full rounded-full metric-bar"
                    style={{ width: `${barW}%`, background: barColor }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold w-7 text-right flex-shrink-0" style={{ color: barColor }}>
                  {barW}
                </span>
              </div>

              {/* Signal pill strip */}
              <div className="flex items-center gap-2 ml-10 mt-1.5">
                <div className="flex gap-0.5">
                  {Array.from({ length: d.buy }, (_, i) => (
                    <div key={`b${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                  ))}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.min(d.neutral, 8) }, (_, i) => (
                    <div key={`n${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--border-hover)" }} />
                  ))}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: d.sell }, (_, i) => (
                    <div key={`s${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
                  ))}
                </div>
                <span className="text-[9px] font-mono ml-1" style={{ color: "var(--text-dim)" }}>
                  {d.buy}↑ {d.neutral}≈ {d.sell}↓
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-4 mt-5 pt-4 text-[9px] font-mono"
        style={{ borderTop: "1px solid var(--border)", color: "var(--text-dim)" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
          <span>Buy signals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--border-hover)" }} />
          <span>Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
          <span>Sell signals</span>
        </div>
      </div>
    </div>
  );
}
