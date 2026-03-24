"use client";

import React from 'react';
import ScoreGauge from './score-gauge';
import { formatNumber } from '@/lib/utils';

interface ScoreHeroProps {
  ticker: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  finalScore: number;
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

export default function ScoreHero({
  ticker,
  companyName,
  price,
  change,
  changePercent,
  finalScore,
  rating,
  ratingColor,
  image,
  marketCap,
  pe,
  eps,
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
      {/* Background gradient + grid pattern */}
      <div className="hero-grid absolute inset-0 opacity-20" />
      
      <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center justify-between">
        {/* Company Header */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Ticker + Logo */}
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

        {/* Score Gauge + Quick Stats */}
        <div className="flex flex-col items-center lg:items-end gap-6 lg:gap-8 flex-shrink-0">
          {/* Main Score Gauge */}
          <div className="relative">
            <ScoreGauge 
              score={finalScore} 
              rating={rating} 
              ratingColor={ratingColor}
              size={200}
            />
            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-green-fintech/10 to-yellow-fintech/5 rounded-2xl border-2 border-slate-800/50 shadow-glow" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm text-center">
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

