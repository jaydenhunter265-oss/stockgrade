"use client";

import { useState, useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";

interface ChartPoint {
  date: string;
  close: number;
  high?: number;
  low?: number;
  open?: number;
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

function toUTC(dateStr: string): UTCTimestamp {
  return Math.floor(new Date(dateStr).getTime() / 1000) as UTCTimestamp;
}

function calcSMA(data: ChartPoint[], period: number): { time: UTCTimestamp; value: number }[] {
  const out: { time: UTCTimestamp; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const avg = data.slice(i - period + 1, i + 1).reduce((s, d) => s + d.close, 0) / period;
    out.push({ time: toUTC(data[i].date), value: parseFloat(avg.toFixed(4)) });
  }
  return out;
}

export default function PriceChart({ ticker, currentPrice, change, changePercent }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"line" | "candle">("line");
  const [showSMA, setShowSMA] = useState(true);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [hoverChange, setHoverChange] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  // Fetch OHLCV data
  useEffect(() => {
    setLoading(true);
    setHoverPrice(null);
    setHoverChange(null);
    setHoverTime(null);
    fetch(`/api/chart?ticker=${ticker}&range=${timeframe}`)
      .then((r) => r.json())
      .then((d) => setData(d.quotes ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ticker, timeframe]);

  // Build / rebuild chart whenever data or display options change
  useEffect(() => {
    if (!containerRef.current || loading || data.length < 2) return;

    // Destroy previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const el = containerRef.current;
    const isPositive = data[data.length - 1].close >= data[0].close;
    const lineColor = isPositive ? "#10b981" : "#ef4444";
    const intraday = timeframe === "1D" || timeframe === "5D";
    const hasOHLC = data.some((d) => d.open != null && d.high != null && d.low != null);

    const chart = createChart(el, {
      width: el.clientWidth,
      height: 290,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255,255,255,0.3)",
        fontFamily: "'SF Mono', 'Fira Code', monospace",
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
        timeVisible: intraday,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });
    chartRef.current = chart;

    // Crosshair subscription for live price/time display
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoverPrice(null);
        setHoverChange(null);
        setHoverTime(null);
        return;
      }

      // Extract price from whichever series is active
      let price: number | null = null;
      for (const [, val] of param.seriesData) {
        if (val && "value" in val) { price = (val as { value: number }).value; break; }
        if (val && "close" in val) { price = (val as { close: number }).close; break; }
      }
      if (price !== null) {
        setHoverPrice(price);
        setHoverChange(price - data[0].close);
      }

      const ts = typeof param.time === "number" ? param.time * 1000 : 0;
      if (ts) {
        const d = new Date(ts);
        setHoverTime(
          intraday
            ? d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
            : d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: timeframe === "1Y" || timeframe === "5Y" ? "numeric" : undefined,
              })
        );
      }
    });

    // Volume histogram (bottom 20%)
    if (data.some((d) => d.volume != null)) {
      const volSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        color: "rgba(255,255,255,0.07)",
      });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, borderVisible: false });
      volSeries.setData(
        data
          .filter((d) => d.volume != null)
          .map((d) => ({
            time: toUTC(d.date),
            value: d.volume!,
            color: d.open != null && d.close >= d.open ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
          }))
      );
    }

    // Main price series
    if (chartType === "candle" && hasOHLC) {
      const cs = chart.addSeries(CandlestickSeries, {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#3ecf8e",
        wickDownColor: "#f87171",
        priceScaleId: "right",
      });
      cs.setData(
        data
          .filter((d) => d.open != null)
          .map((d) => ({
            time: toUTC(d.date),
            open: d.open!,
            high: d.high!,
            low: d.low!,
            close: d.close,
          }))
      );
    } else {
      const as = chart.addSeries(AreaSeries, {
        lineColor,
        topColor: lineColor + "28",
        bottomColor: lineColor + "00",
        lineWidth: 2,
        priceScaleId: "right",
      });
      as.setData(data.map((d) => ({ time: toUTC(d.date), value: d.close })));
    }

    // SMA overlays (only for daily+ intervals with enough data)
    if (showSMA && chartType === "line" && !intraday) {
      if (data.length >= 20) {
        const sma20 = chart.addSeries(LineSeries, {
          color: "rgba(99,102,241,0.65)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          priceScaleId: "right",
        });
        sma20.setData(calcSMA(data, 20));
      }
      if (data.length >= 50) {
        const sma50 = chart.addSeries(LineSeries, {
          color: "rgba(245,158,11,0.65)",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          priceScaleId: "right",
        });
        sma50.setData(calcSMA(data, 50));
      }
    }

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (el && chartRef.current) chartRef.current.applyOptions({ width: el.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chartType, showSMA, timeframe, loading]);

  const hasOHLCData = data.some((d) => d.open != null);
  const intraday = timeframe === "1D" || timeframe === "5D";
  const canShowSMA = !intraday && chartType === "line";

  // Displayed values: hover overrides current
  const displayPrice = hoverPrice ?? currentPrice;
  const displayDelta = hoverChange ?? change;
  const displayPct = hoverChange !== null && data[0]?.close
    ? (hoverChange / data[0].close) * 100
    : changePercent;
  const displayPos = displayDelta >= 0;

  return (
    <div className="card rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="section-label mb-1">Price Chart</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xl font-black font-mono" style={{ color: "var(--text)" }}>
              ${displayPrice.toFixed(2)}
            </span>
            <span className="text-xs font-mono font-semibold" style={{ color: displayPos ? "#10b981" : "#ef4444" }}>
              {displayPos ? "+" : ""}
              {displayDelta.toFixed(2)} ({displayPct.toFixed(2)}%)
            </span>
            {hoverTime && (
              <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>
                {hoverTime}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Candle / Line toggle — only when OHLC data exists */}
          {hasOHLCData && (
            <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
              {(["line", "candle"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all capitalize"
                  style={{
                    background: chartType === t ? "var(--accent)" : "transparent",
                    color: chartType === t ? "white" : "var(--text-muted)",
                  }}
                >
                  {t === "line" ? "Line" : "Candle"}
                </button>
              ))}
            </div>
          )}

          {/* SMA toggle */}
          {canShowSMA && (
            <button
              onClick={() => setShowSMA((s) => !s)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
              style={{
                background: showSMA ? "rgba(99,102,241,0.1)" : "transparent",
                border: `1px solid ${showSMA ? "rgba(99,102,241,0.3)" : "var(--border)"}`,
                color: showSMA ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              SMA
            </button>
          )}

          {/* Timeframe tabs */}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
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
      </div>

      {/* SMA legend */}
      {canShowSMA && showSMA && data.length >= 20 && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px rounded" style={{ background: "rgba(99,102,241,0.65)", height: 2 }} />
            <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>SMA 20</span>
          </div>
          {data.length >= 50 && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 rounded" style={{ background: "rgba(245,158,11,0.65)", height: 2 }} />
              <span className="text-[10px] font-mono" style={{ color: "var(--text-dim)" }}>SMA 50</span>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="h-72 shimmer rounded-xl" />
      ) : data.length < 2 ? (
        <div className="h-72 flex items-center justify-center">
          <span className="text-sm" style={{ color: "var(--text-dim)" }}>No chart data available</span>
        </div>
      ) : (
        <div ref={containerRef} className="w-full" />
      )}
    </div>
  );
}
