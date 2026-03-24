"use client";

import React from 'react';

interface AIVerdictBoxProps {
  ticker: string;
  score: number;
  rating: string;
  ratingColor: string;
  totalBuy: number;
  totalSell: number;
  totalMetrics: number;
  verdictText: string;
}

export default function AIVerdictBox({
  ticker,
  score,
  rating,
  ratingColor,
  totalBuy,
  totalSell,
  totalMetrics,
  verdictText,
}: AIVerdictBoxProps) {
  const icon = score >= 75 ? '⭐' : score >= 55 ? '📈' : score >= 35 ? '⚖️' : '⚠️';
  const signalText = totalBuy > totalSell 
    ? `${totalBuy} bullish vs ${totalSell} bearish` 
    : totalSell > totalBuy 
      ? `${totalSell} bearish vs ${totalBuy} bullish` 
      : 'balanced signals';

  return (
    <div className="verdict-box p-8 lg:p-10 rounded-3xl border shadow-md-fintech backdrop-blur-xl col-span-full layout-main-wide">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start lg:items-center gap-6 mb-6">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/20 backdrop-blur-sm flex items-center justify-center border-2 border-slate-700/30 shadow-glow">
            <span className="text-2xl" style={{ color: ratingColor }}>{icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-full text-slate-400 border border-slate-700/50">
                AI Verdict
              </span>
              <span className="px-3 py-1 bg-gradient-to-r from-slate-700/30 to-slate-800/20 backdrop-blur text-xs font-bold rounded-full border border-slate-700/40">
                Score {score.toFixed(0)}/{100}
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3 leading-tight" style={{ color: ratingColor }}>
              {rating.toUpperCase()}
            </h2>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              {verdictText}
            </p>
          </div>
        </div>

        {/* Signal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/30">
          <div className="text-center p-4 rounded-2xl bg-slate-900/30 backdrop-blur border border-slate-700/40">
            <div className="text-2xl font-bold text-green-fintech mb-1">{totalBuy}</div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Buy Signals</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-slate-900/30 backdrop-blur border border-slate-700/40">
            <div className="text-2xl font-bold text-red-fintech mb-1">{totalSell}</div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Sell Signals</div>
          </div>
          <div className="text-center p-4 rounded-2xl bg-slate-900/30 backdrop-blur border border-slate-700/40 md:col-span-1">
            <div className="text-xl font-bold text-slate-300 mb-1">{totalMetrics}</div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Total Metrics</div>
          </div>
        </div>
      </div>
    </div>
  );
}

