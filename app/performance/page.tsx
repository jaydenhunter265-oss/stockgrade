"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStockHistory, loadPerformanceData, getPerformanceSummary } from '@/lib/performance';
import type { PerformanceEntry, TrackedStock, PerformanceData } from '@/lib/performance';
import { cn, timeAgo } from '@/lib/utils';
import type { EvaluationResult } from '@/lib/types';

interface PerformancePick {
  ticker: string;
  rating: string;
  score: number;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  pnlPct?: number;
  daysHeld?: number;
}

/* ── Rating badge ────────────────────────────── */
function RatingBadge({ rating }: { rating: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'STRONG BUY': { bg: 'rgba(0,217,158,0.10)', color: '#00D99E' },
    'BUY':        { bg: 'rgba(0,217,158,0.07)', color: '#00D99E' },
    'HOLD':       { bg: 'rgba(255,184,0,0.09)',  color: '#FFB800' },
    'SELL':       { bg: 'rgba(255,59,92,0.09)',  color: '#FF3B5C' },
    'STRONG SELL':{ bg: 'rgba(255,59,92,0.12)',  color: '#FF3B5C' },
  };
  const s = map[rating] ?? { bg: 'rgba(141,153,168,0.10)', color: 'var(--text-secondary)' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}28` }}
    >
      {rating}
    </span>
  );
}

/* ── P&L badge ───────────────────────────────── */
function PnlBadge({ pnlPct }: { pnlPct?: number }) {
  if (pnlPct === undefined) return <span className="text-[13px] font-mono" style={{ color: 'var(--text-dim)' }}>—</span>;
  const color = pnlPct >= 20 ? '#00D99E' : pnlPct >= 0 ? '#00BFA5' : pnlPct >= -10 ? '#FFB800' : '#FF3B5C';
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded text-[12px] font-bold font-mono"
      style={{ background: color + '10', color, border: `1px solid ${color}20` }}
    >
      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
    </span>
  );
}

/* ── Picks table ─────────────────────────────── */
function PerformanceTable({ picks }: { picks: PerformancePick[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="perf-table">
        <thead>
          <tr>
            <th className="text-left">Ticker</th>
            <th className="text-left">Rating</th>
            <th className="text-right">Score</th>
            <th className="text-right">Entry</th>
            <th className="text-right">P&L</th>
            <th className="text-right">Days</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((pick, i) => (
            <tr key={i}>
              <td>
                <span className="font-mono font-bold text-[14px]" style={{ color: 'var(--text)' }}>
                  {pick.ticker}
                </span>
              </td>
              <td><RatingBadge rating={pick.rating} /></td>
              <td className="text-right">
                <span className="font-mono font-bold text-[13px]" style={{ color: 'var(--accent)' }}>
                  {pick.score}
                </span>
              </td>
              <td className="text-right">
                <span className="font-mono text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  ${pick.entryPrice?.toFixed(2) ?? '—'}
                </span>
              </td>
              <td className="text-right"><PnlBadge pnlPct={pick.pnlPct} /></td>
              <td className="text-right">
                <span className="font-mono text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {pick.daysHeld ?? '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Mini sparkline ──────────────────────────── */
function StockHistoryChart({ history }: { history: PerformanceEntry[] }) {
  if (history.length < 2) return null;

  const prices = history.map(h => h.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;
  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? '#00D99E' : '#FF3B5C';

  const points = history.map((h, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = 100 - (((h.price - minPrice) / range) * 80 + 10);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="h-14 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`g-${lineColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Fill area */}
        <polyline
          points={`0,100 ${points} 100,100`}
          fill={`url(#g-${lineColor.replace('#', '')})`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ── Stat card ───────────────────────────────── */
function StatCard({ value, label, color, sub }: { value: string; label: string; color: string; sub?: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

/* ── Loading skeleton ────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 header-glass" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="page-container h-14 flex items-center gap-4">
          <div className="skeleton w-28 h-5 rounded" />
          <div className="ml-auto skeleton w-20 h-7 rounded-lg" />
        </div>
      </header>
      <main className="page-container py-12">
        <div className="skeleton w-64 h-9 rounded-xl mb-3" />
        <div className="skeleton w-80 h-5 rounded mb-10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-72 rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-44 rounded-xl" />)}
        </div>
      </main>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */

export default function PerformancePage() {
  const [summary, setSummary] = useState<{
    totalPicks: number;
    winRate: number;
    picks: PerformancePick[];
  } | null>(null);
  const [allData, setAllData] = useState<PerformanceData | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [history, setHistory] = useState<PerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPerformanceSummary(), loadPerformanceData()])
      .then(([sum, data]) => {
        setSummary(sum);
        setAllData(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedStock) {
      getStockHistory(selectedStock).then(setHistory);
    }
  }, [selectedStock]);

  if (loading) return <LoadingSkeleton />;

  const topPicks = summary?.picks.slice(0, 10) || [];
  const trackedStocks = allData?.trackedStocks || {};
  const avgPnl = topPicks.length
    ? topPicks.filter(p => p.pnlPct !== undefined).reduce((s, p) => s + (p.pnlPct ?? 0), 0) /
      Math.max(1, topPicks.filter(p => p.pnlPct !== undefined).length)
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-40 header-glass">
        <div className="page-container h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" style={{ textDecoration: 'none' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              S
            </div>
            <span className="text-[14px] font-semibold tracking-tight hidden sm:block" style={{ color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
              StockGrade
            </span>
          </Link>

          {/* Page title */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <div className="w-px h-4" style={{ background: 'var(--border-hover)' }} />
            <span className="text-[13px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Performance</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="btn-ghost btn-sm flex items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Analyze
            </Link>
          </div>
        </div>
      </header>

      {/* ═══ Main ═══ */}
      <main className="flex-1 page-container py-12">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="live-dot" />
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Live tracking
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight mb-3"
            style={{ color: 'var(--text)', letterSpacing: '-0.04em' }}
          >
            Performance{' '}
            <span className="gradient-text">Tracker</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-xl" style={{ color: 'var(--text-muted)' }}>
            Tracking{' '}
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {Object.keys(trackedStocks).length}
            </span>{' '}
            stocks with{' '}
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {summary?.totalPicks ?? 0}
            </span>{' '}
            rated picks in the ledger.
          </p>
        </div>

        {/* ═══ Summary stats ═══ */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Total Picks"
              value={String(summary.totalPicks)}
              color="var(--accent)"
              sub="Tracked since launch"
            />
            <StatCard
              label="Win Rate"
              value={`${Math.round(summary.winRate * 100)}%`}
              color={summary.winRate >= 0.5 ? 'var(--green)' : 'var(--amber)'}
              sub={summary.winRate >= 0.5 ? 'Above 50% threshold' : 'Below 50% threshold'}
            />
            <StatCard
              label="Best Pick"
              value={topPicks[0]?.pnlPct != null ? `${topPicks[0].pnlPct >= 0 ? '+' : ''}${topPicks[0].pnlPct.toFixed(1)}%` : '—'}
              color={topPicks[0]?.pnlPct != null && topPicks[0].pnlPct >= 0 ? 'var(--green)' : 'var(--red)'}
              sub={topPicks[0]?.ticker ?? 'No picks yet'}
            />
            <StatCard
              label="Tracked Stocks"
              value={String(Object.keys(trackedStocks).length)}
              color="var(--blue)"
              sub="Unique tickers evaluated"
            />
          </div>
        )}

        {/* ═══ Recent picks table ═══ */}
        {topPicks.length > 0 && (
          <div className="card mb-10">
            <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Recent Picks</h2>
              </div>
              <span className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>
                Showing {topPicks.length} picks
              </span>
            </div>
            <div className="px-0 pb-0">
              <PerformanceTable picks={topPicks} />
            </div>
          </div>
        )}

        {/* ═══ Empty state ═══ */}
        {topPicks.length === 0 && !loading && (
          <div className="empty-state mb-10">
            <div className="empty-state-icon">📊</div>
            <h3 className="text-[15px] font-bold mb-2" style={{ color: 'var(--text)' }}>No picks yet</h3>
            <p className="text-[13px] max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Start analyzing stocks on the home page to build your performance record.
            </p>
            <Link
              href="/"
              className="btn-primary mt-5"
            >
              Analyze a Stock →
            </Link>
          </div>
        )}

        {/* ═══ Tracked stocks grid ═══ */}
        {Object.keys(trackedStocks).length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[17px] font-bold" style={{ color: 'var(--text)' }}>Tracked Stock History</h2>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded"
                style={{ background: 'var(--card-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                {Math.min(Object.keys(trackedStocks).length, 9)} shown
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(trackedStocks).slice(0, 9).map(([ticker, stock]) => {
                const latest = stock.entries[stock.entries.length - 1];
                const earliest = stock.entries[0];
                const isSelected = selectedStock === ticker;
                const priceChange = latest && earliest
                  ? ((latest.price - earliest.price) / earliest.price) * 100
                  : null;
                const scoreColor = latest?.score >= 65 ? 'var(--green)' : latest?.score >= 40 ? 'var(--amber)' : 'var(--red)';

                return (
                  <div
                    key={ticker}
                    onClick={() => setSelectedStock(isSelected ? '' : ticker)}
                    className={cn(
                      'card card-interactive p-5 cursor-pointer',
                      isSelected && 'shadow-glow'
                    )}
                    style={isSelected ? { borderColor: 'var(--accent-border)', background: 'var(--card-hover)' } : {}}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-[16px] font-black font-mono tracking-tight" style={{ color: 'var(--text)' }}>
                          {ticker}
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
                          First tracked {timeAgo(stock.firstTracked)}
                        </div>
                      </div>
                      {latest && (
                        <div className="text-right">
                          <div className="text-[22px] font-black font-mono leading-none" style={{ color: scoreColor }}>
                            {latest.score.toFixed(0)}
                          </div>
                          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-dim)' }}>
                            ${latest.price.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sparkline */}
                    {stock.entries.length > 1 && (
                      <div className="mb-3">
                        <StockHistoryChart history={stock.entries.slice(-20)} />
                      </div>
                    )}

                    {/* Bottom row */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                        {stock.entries.length} evals · {stock.picks.length} picks
                      </span>
                      {priceChange !== null && (
                        <span
                          className="text-[11px] font-bold font-mono px-2 py-0.5 rounded"
                          style={{
                            color: priceChange >= 0 ? 'var(--green)' : 'var(--red)',
                            background: priceChange >= 0 ? 'rgba(0,217,158,0.08)' : 'rgba(255,59,92,0.08)',
                          }}
                        >
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ Selected stock detail ═══ */}
        {selectedStock && history.length > 0 && (
          <section className="mb-10 animate-fade-in">
            <div
              className="card p-6 sm:p-8"
              style={{ borderColor: 'var(--border-hover)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
                  >
                    {selectedStock.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-[18px] font-black tracking-tight" style={{ color: 'var(--text)' }}>
                      {selectedStock}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-dim)' }}>
                      {history.length} data points
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStock('')}
                  className="btn-ghost btn-sm"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score history chart */}
                <div>
                  <div className="section-label mb-4">Score History</div>
                  <StockHistoryChart history={history} />
                  <div className="mt-3 flex items-center justify-between text-[12px]" style={{ color: 'var(--text-dim)' }}>
                    <span>{timeAgo(history[0]?.date ?? '')}</span>
                    <span>{timeAgo(history[history.length - 1]?.date ?? '')}</span>
                  </div>
                </div>

                {/* Key stats */}
                <div>
                  <div className="section-label mb-4">Key Stats</div>
                  <div className="space-y-0" style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    {[
                      { label: 'Total Evaluations', value: history.length.toString(), color: 'var(--text)' },
                      { label: 'Average Score', value: String(Math.round(history.reduce((a, b) => a + b.score, 0) / history.length)), color: 'var(--accent)' },
                      { label: 'Best Score', value: Math.max(...history.map(h => h.score)).toFixed(0), color: 'var(--green)' },
                      { label: 'Latest Score', value: history[history.length - 1]?.score.toFixed(0) ?? '—', color: history[history.length-1]?.score >= 55 ? 'var(--green)' : history[history.length-1]?.score >= 35 ? 'var(--amber)' : 'var(--red)' },
                      { label: 'Score Trend', value: history[history.length-1]?.score > history[Math.max(0, history.length-5)]?.score ? '↑ Improving' : '↓ Declining', color: history[history.length-1]?.score > history[Math.max(0, history.length-5)]?.score ? 'var(--green)' : 'var(--red)' },
                    ].map((row, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: i < 4 ? '1px solid var(--border)' : undefined }}
                      >
                        <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                        <span className="font-mono font-bold text-[13px]" style={{ color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Latest rating */}
                  {history[history.length - 1]?.rating && (
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-[12px]" style={{ color: 'var(--text-dim)' }}>Latest rating:</span>
                      <RatingBadge rating={history[history.length - 1].rating} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ═══ CTA ═══ */}
        <div
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mx-auto mb-5"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}
          >
            📈
          </div>
          <h2 className="text-[20px] font-black mb-2 tracking-tight" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Analyze more stocks
          </h2>
          <p className="text-[14px] max-w-sm mx-auto mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Every evaluation adds to your performance record. Track as many stocks as you want.
          </p>
          <Link
            href="/"
            className="btn-primary btn-lg"
          >
            Start Analyzing
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer style={{ borderTop: '1px solid var(--border)', marginTop: '48px' }}>
        <div className="page-container py-5">
          <div className="flex items-center justify-between text-[12px]" style={{ color: 'var(--text-dim)' }}>
            <span>© {new Date().getFullYear()} StockGrade</span>
            <div className="flex items-center gap-4">
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Analyze</Link>
              <Link href="/methodology" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Methodology</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
