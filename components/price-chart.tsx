"use client";

import { useState, useEffect, useRef } from "react";

interface ChartPoint {
  date: string;
  close: number;
  volume?: number;
}

interface PriceChartProps {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

const TIMEFRAMES = ["1D", "5D", "1M", "3M", "1Y", "5Y"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

export default function PriceChart({ ticker, currentPrice, change, changePercent }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setLoading(true);
    setHoverIndex(null);
    fetch(`/api/chart?ticker=${ticker}&range=${timeframe}`)
      .then((res) => res.json())
      .then((d) => setData(d.quotes || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ticker, timeframe]);

  if (loading) {
    return <div className="card rounded-xl h-80 shimmer" />;
  }

  if (data.length < 2) {
    return (
      <div className="card rounded-xl h-80 flex items-center justify-center">
        <span className="text-sm" style={{ color: "var(--text-dim)" }}>
          No chart data available for this timeframe
        </span>
      </div>
    );
  }

  const closes = data.map((d) => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const W = 800;
  const H = 260;
  const padT = 15;
  const padB = 25;
  const padL = 0;
  const padR = 0;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const points = data.map((_, i) => ({
    x: padL + (i / (data.length - 1)) * cW,
    y: padT + cH - ((closes[i] - min) / range) * cH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${H - padB} L ${points[0].x.toFixed(1)} ${H - padB} Z`;

  const isPositive = closes[closes.length - 1] >= closes[0];
  const chartColor = isPositive ? "#10b981" : "#ef4444";

  const hoverPoint = hoverIndex !== null ? data[hoverIndex] : null;
  const hoverXY = hoverIndex !== null ? points[hoverIndex] : null;

  // Price change for hovered point relative to first point
  const hoverChange = hoverIndex !== null ? closes[hoverIndex] - closes[0] : null;
  const hoverChangePct = hoverIndex !== null && closes[0] !== 0 ? ((closes[hoverIndex] - closes[0]) / closes[0]) * 100 : null;

  // Format date based on timeframe
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    if (timeframe === "1D" || timeframe === "5D") {
      return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }
    if (timeframe === "1M" || timeframe === "3M") {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padT + cH * (1 - pct),
    price: min + range * pct,
  }));

  return (
    <div className="card rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="section-label mb-1">Price Chart</div>
          {hoverPoint ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono" style={{ color: "var(--text)" }}>
                ${hoverPoint.close.toFixed(2)}
              </span>
              <span
                className="text-xs font-mono font-semibold"
                style={{ color: hoverChange !== null && hoverChange >= 0 ? "#10b981" : "#ef4444" }}
              >
                {hoverChange !== null && hoverChange >= 0 ? "+" : ""}
                {hoverChange?.toFixed(2)} ({hoverChangePct?.toFixed(2)}%)
              </span>
              <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>
                {formatDate(hoverPoint.date)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-mono" style={{ color: "var(--text)" }}>
                ${currentPrice.toFixed(2)}
              </span>
              <span className="text-xs font-mono font-semibold" style={{ color: chartColor }}>
                {change >= 0 ? "+" : ""}
                {change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* Timeframe tabs */}
        <div className="flex gap-0.5 p-1 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="px-2.5 py-1.5 rounded-md text-[11px] font-bold font-mono cursor-pointer transition-all"
              style={{
                background: timeframe === tf ? "var(--accent)" : "transparent",
                color: timeframe === tf ? "white" : "var(--text-muted)",
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart SVG */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto chart-svg"
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = ((e.clientX - rect.left) / rect.width) * W;
            const idx = Math.round(((x - padL) / cW) * (data.length - 1));
            setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
          }}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchMove={(e) => {
            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect || !e.touches[0]) return;
            const x = ((e.touches[0].clientX - rect.left) / rect.width) * W;
            const idx = Math.round(((x - padL) / cW) * (data.length - 1));
            setHoverIndex(Math.max(0, Math.min(data.length - 1, idx)));
          }}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={`chartGrad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
              <stop offset="80%" stopColor={chartColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines + price labels */}
          {yLabels.map((label, i) => (
            <g key={i}>
              <line x1={padL} y1={label.y} x2={W - padR} y2={label.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={W - 4} y={label.y - 5} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="var(--font-mono)">
                ${label.price.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#chartGrad-${ticker})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${chartColor}40)` }}
          />

          {/* Hover crosshair */}
          {hoverXY && (
            <>
              <line x1={hoverXY.x} y1={padT} x2={hoverXY.x} y2={H - padB} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1={padL} y1={hoverXY.y} x2={W - padR} y2={hoverXY.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,3" />
              {/* Glow dot */}
              <circle cx={hoverXY.x} cy={hoverXY.y} r="6" fill={chartColor} opacity="0.2" />
              <circle cx={hoverXY.x} cy={hoverXY.y} r="4" fill={chartColor} stroke="var(--bg)" strokeWidth="2" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
