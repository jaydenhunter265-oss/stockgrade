"use client";

import React from 'react';
import { formatNumber } from '@/lib/utils';

interface ScoreHeroProps {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  qualityScore: number;
  growthScore: number;
  valueScore: number;
  combinedScore: number;
  rating: string;
  ratingColor: string;
  image?: string;
  marketCap?: number;
  pe?: number;
  eps?: number;
  beta?: number;
  dayLow?: number;
  dayHigh?: number;
  yearLow?: number;
  yearHigh?: number;
}

function ScoreBox({ label, score, color, sub }: { label: string; score: number; color: string; sub: string }) {
  return (
    <div
      className="rounded-xl p-4 text-center flex-1"
      style={{ background: color + "0d", border: `1px solid ${color}28` }}
    >
      <div className="text-[28px] font-black font-mono leading-none" style={{ color }}>{score}</div>
      <div className="text-[8px] opacity-30 font-mono leading-none mt-0.5" style={{ color }}>/100</div>
      <div className="text-[9px] font-bold uppercase tracking-wider mt-1.5" style={{ color }}>{label}</div>
      <div className="text-[8px] mt-0.5 opacity-50" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
    </div>
  );
}

export default function ScoreHero({
  ticker,
  companyName,
  price,
  change,
  changePercent,
  qualityScore,
  growthScore,
  valueScore,
  combinedScore,
  rating,
  ratingColor,
  image,
  marketCap,
  pe,
  beta,
  dayLow,
  dayHigh,
  yearLow,
  yearHigh,
}: ScoreHeroProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-fintech' : 'text-red-fintech';

  return (
    <section className="score-hero shadow-lg-fintech rounded-3xl p-8 lg:p-12 overflow-hidden col-span-full layout-main-wide">
      <div className="hero-grid absolute inset-0 opacity-20" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center justify-between">
        {/* Company Header */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-4">
            {image && (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-800/50 shadow-md">
                <img src={image} alt={companyName} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-hero-2xl font-hero font-mono tracking-hero">{ticker}</h1>
                <span className="px-3 py-1.5 bg-gradient-to-r from-slate-700/50 to-slate-800/50 backdrop-blur-sm rounded-full text-xs font-bold border border-slate-700/50">
                  {rating}
                </span>
              </div>
              <p className="text-base font-medium text-slate-300 max-w-md">{companyName}</p>
            </div>
          </div>

          {/* Price Display */}
          <div className="flex flex-wrap items-baseline gap-4 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-hero-3xl font-hero font-metric">${price.toFixed(2)}</span>
              <span className={`text-sm font-semibold font-mono px-3 py-1.5 rounded-xl bg-slate-900/50 backdrop-blur-sm border ${changeColor} border-slate-700/50`}>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Key Ranges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dayLow != null && dayHigh != null && dayLow > 0 && dayHigh > 0 && (
              <div className="metric-card">
                <div className="metric-label">Day Range</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-slate-400">${dayLow.toFixed(2)}</span>
                  <span className="text-sm font-mono font-semibold text-slate-200">${dayHigh.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden border border-slate-800/50">
                  <div className="h-full bg-gradient-to-r from-red-fintech/30 via-amber/20 to-green-fintech/30 rounded-full metric-bar" style={{ width: '100%' }} />
                </div>
              </div>
            )}
            {yearLow != null && yearHigh != null && yearLow > 0 && yearHigh > 0 && (
              <div className="metric-card">
                <div className="metric-label">52 Week Range</div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-mono text-slate-400">${yearLow.toFixed(2)}</span>
                  <span className="text-sm font-mono font-semibold text-slate-200">${yearHigh.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden border border-slate-800/50">
                  <div className="h-full bg-gradient-to-r from-red-fintech/20 to-green-fintech/20 rounded-full metric-bar" style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4 Score Boxes + Quick Stats */}
        <div className="flex flex-col items-stretch lg:items-end gap-6 flex-shrink-0 w-full lg:w-auto lg:max-w-xs">
          {/* Four Scores */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreBox label="Quality" score={qualityScore} color="#10b981" sub="Prof · Debt · FCF" />
            <ScoreBox label="Growth" score={growthScore} color="#3b82f6" sub="Rev · EPS · FCF" />
            <ScoreBox label="Value" score={valueScore} color="#a78bfa" sub="P/E · EV · Yield" />
            <ScoreBox label="Combined" score={combinedScore} color={ratingColor} sub="40Q · 30G · 30V" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full text-center">
            {marketCap && (
              <div className="metric-card p-4">
                <div className="metric-label">Market Cap</div>
                <div className="text-xl font-bold font-metric">{formatNumber(marketCap)}</div>
              </div>
            )}
            {pe && (
              <div className="metric-card p-4">
                <div className="metric-label">P/E Ratio</div>
                <div className="text-xl font-bold font-metric">{pe.toFixed(1)}</div>
              </div>
            )}
            {beta && (
              <div className="metric-card p-4">
                <div className="metric-label">Beta</div>
                <div className="text-xl font-bold font-metric">{beta.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
