"use client";

import { useEffect, useState } from 'react';
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

function RatingBadge({ rating }: { rating: string }) {
  const colors = {
    'STRONG BUY': { bg: '#22c55e', text: '#000' },
    'BUY': { bg: '#4ade80', text: '#000' },
    'HOLD': { bg: '#f59e0b', text: '#000' },
    'SELL': { bg: '#f97316', text: '#fff' },
    'STRONG SELL': { bg: '#ef4444', text: '#fff' },
  } as Record<string, any>;

  const style = colors[rating] || { bg: '#a1a1aa', text: '#000' };
  return (
    <span
      className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide"
      style={{
        background: style.bg + '14',
        border: `1px solid ${style.bg}30`,
        color: style.text,
      }}
    >
      {rating}
    </span>
  );
}

function PnlBadge({ pnlPct }: { pnlPct?: number }) {
  if (pnlPct === undefined) return <span className="text-xs text-gray-400">—</span>;

  const color = pnlPct >= 20 ? '#22c55e' : pnlPct >= 0 ? '#10b981' : pnlPct >= -10 ? '#f59e0b' : '#ef4444';
  return (
    <span
      className="px-2 py-1 rounded text-xs font-black font-mono tracking-wide"
      style={{ background: color + '12', color }}
    >
      {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
    </span>
  );
}

function PerformanceTable({ picks }: { picks: PerformancePick[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">Ticker</th>
            <th className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">Rating</th>
            <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">Score</th>
            <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">P&L</th>
            <th className="text-right py-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">Days</th>
          </tr>
        </thead>
        <tbody>
          {picks.map((pick, i) => (
            <tr key={i} className="border-b border-gray-900 hover:bg-white/5">
              <td className="py-3 px-4 font-mono font-semibold text-sm">{pick.ticker}</td>
              <td className="py-3 px-4">
                <RatingBadge rating={pick.rating} />
              </td>
              <td className="py-3 px-4 text-right font-mono font-bold text-sm">{pick.score}</td>
              <td className="py-3 px-4">
                <PnlBadge pnlPct={pick.pnlPct} />
              </td>
              <td className="py-3 px-4 text-right text-sm font-mono">{pick.daysHeld || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockHistoryChart({ ticker, history }: { ticker: string; history: PerformanceEntry[] }) {
  if (history.length < 2) return null;

  const maxPrice = Math.max(...history.map(h => h.price));
  const minPrice = Math.min(...history.map(h => h.price));
  const range = maxPrice - minPrice;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-mono text-gray-400">
        <span>{timeAgo(history[0]?.date || '')}</span>
        <span>{timeAgo(history[history.length - 1]?.date || '')}</span>
      </div>
      <div className="h-20 relative bg-gray-900/30 rounded-lg overflow-hidden">
        <svg viewBox="0 0 100 20" className="w-full h-full">
          <polyline
            points={history.map((h, i) => {
              const x = (i / (history.length - 1)) * 100;
              const y = 20 - (((h.price - minPrice) / range) * 18 + 1);
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-xs font-mono bg-black/50 px-2 py-1 rounded text-center">
            {history[history.length - 1]?.price.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [summary, setSummary] = useState<{ totalPicks: number; winRate: number; picks: PerformancePick[] } | null>(null);
  const [allData, setAllData] = useState<PerformanceData | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [history, setHistory] = useState<PerformanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPerformanceSummary(),
      loadPerformanceData()
    ]).then(([sum, data]) => {
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

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-800 rounded-lg w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-gray-800 rounded w-3/4" />
                  <div className="h-12 bg-gray-800 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topPicks = summary?.picks.slice(0, 8) || [];
  const trackedStocks = allData?.trackedStocks || {};

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-950 to-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent mb-4 tracking-tight">
            Performance Tracker
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Tracking {Object.keys(trackedStocks).length || 0} stocks with {summary?.totalPicks || 0} rated picks
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-teal-500/50 transition-all duration-300">
              <div className="text-3xl font-black text-teal-400 group-hover:text-teal-300 mb-2">{summary.totalPicks}</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Picks</div>
            </div>
            <div className="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-emerald-500/50 transition-all duration-300">
              <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                {Math.round(summary.winRate * 100)}%
              </div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Win Rate</div>
            </div>
            <div className="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-amber-500/50 transition-all duration-300">
              <div className="text-3xl font-black text-amber-400 group-hover:text-amber-300 mb-2">
                {topPicks[0]?.pnlPct ? topPicks[0].pnlPct.toFixed(1) + '%' : '—'}
              </div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Best Pick</div>
            </div>
            <div className="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-blue-500/50 transition-all duration-300">
              <div className="text-3xl font-black text-blue-400 group-hover:text-blue-300 mb-2">
                {Object.keys(trackedStocks).length}
              </div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Tracked Stocks</div>
            </div>
          </div>
        )}

        {/* Top Picks Table */}
        {topPicks.length > 0 && (
          <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Recent Picks</h2>
              <a href="#all-picks" className="text-sm font-medium text-teal-400 hover:text-teal-300">View All →</a>
            </div>
            <PerformanceTable picks={topPicks} />
          </div>
        )}

        {/* Tracked Stocks Grid */}
        {Object.keys(trackedStocks).length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-black mb-8 text-center">Tracked Stock History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(trackedStocks).slice(0, 9).map(([ticker, stock]) => {
                const latest = stock.entries[stock.entries.length - 1];
                return (
                  <div
                    key={ticker}
                    className="group p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-teal-500/50 hover:bg-gray-900/70 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedStock(ticker)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-lg font-black font-mono text-white">{ticker}</div>
                        <div className="text-sm text-gray-400 mt-1">First tracked {timeAgo(stock.firstTracked)}</div>
                      </div>
                      {latest && (
                        <div className="text-right">
                          <div className="text-2xl font-black text-teal-400">{latest.score.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">${latest.price.toFixed(2)}</div>
                        </div>
                      )}
                    </div>
                    {stock.entries.length > 1 && (
                      <StockHistoryChart ticker={ticker} history={stock.entries.slice(-20)} />
                    )}
                    <div className="text-xs text-gray-500 mt-3">
                      {stock.entries.length} evaluations • {stock.picks.length} picks
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Stock Detail */}
        {selectedStock && history.length > 0 && (
          <div id="stock-detail" className="mb-12">
            <div className="max-w-4xl mx-auto bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setSelectedStock('')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to overview
                </button>
                <div className="text-3xl font-black text-white">{selectedStock}</div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* History Chart */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Score History</h3>
                  <StockHistoryChart ticker={selectedStock} history={history} />
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
                    <div>Current: {history[history.length-1]?.score?.toFixed(0) || '—'}</div>
                    <div>Trend: {history[history.length-1]?.score! > history[history.length-10]?.score! ? '↑ Improving' : '↓ Declining'}</div>
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-bold mb-4">Key Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-sm font-medium text-gray-300">Evaluations</span>
                      <span className="font-mono font-bold text-white">{history.length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-sm font-medium text-gray-300">Avg Score</span>
                      <span className="font-mono font-bold text-teal-400">
                        {Math.round(history.reduce((a,b)=>a+b.score,0)/history.length)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-sm font-medium text-gray-300">Best Score</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {Math.max(...history.map(h => h.score)).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm font-medium text-gray-300">Recent Rating</span>
                      <div>
                        <RatingBadge rating={history[history.length-1]?.rating || 'HOLD'} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center py-16">
          <h2 className="text-2xl font-black mb-4 text-white">Ready to dive deeper?</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
            Track more stocks and see full historical performance analysis.
          </p>
          <a 
            href="/analyze" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 transition-all duration-300 shadow-2xl hover:shadow-teal-500/25 hover:-translate-y-1"
          >
            Start Tracking →
          </a>
        </div>
      </div>
    </div>
  );
}

