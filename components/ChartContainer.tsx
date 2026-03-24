"use client";

import React from 'react';
import PriceChart from './price-chart';

interface ChartContainerProps {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

export default function ChartContainer({ 
  ticker, 
  currentPrice, 
  change, 
  changePercent 
}: ChartContainerProps) {
  return (
    <section className="metric-card shadow-md-fintech col-span-full layout-main-wide rounded-3xl overflow-hidden">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="section-label mb-2">Live Price Chart</h3>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl lg:text-3xl font-bold font-mono tracking-tight">
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`text-sm font-semibold font-mono px-3 py-1.5 rounded-xl bg-slate-900/50 backdrop-blur border ${change >= 0 ? 'text-green-fintech border-green-fintech/30' : 'text-red-fintech border-red-fintech/30'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 justify-end min-w-[280px]">
            <div className="flex gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
              <button className="px-4 py-2 rounded-lg text-xs font-bold font-mono bg-indigo-500/90 text-white shadow-glow hover:brightness-110 transition-all">
                1D
              </button>
              <button className="px-4 py-2 rounded-lg text-xs font-bold font-mono text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all">
                5D
              </button>
              <button className="px-4 py-2 rounded-lg text-xs font-bold font-mono text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all">
                1M
              </button>
            </div>
            <div className="flex gap-1 p-1 rounded-xl bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm">
              <button className="px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all">
                LINE
              </button>
              <button className="px-3 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all">
                CANDLE
              </button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="w-full h-[400px] lg:h-[450px] rounded-2xl bg-slate-900/70 border border-slate-800/50 backdrop-blur-xl overflow-hidden shadow-inner">
          <PriceChart 
            ticker={ticker} 
            currentPrice={currentPrice} 
            change={change} 
            changePercent={changePercent} 
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-800/30">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <div className="w-4 h-1.5 bg-indigo-500/60 rounded-full" />
            <span>SMA 20</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <div className="w-4 h-1.5 bg-orange-500/60 rounded-full" />
            <span>SMA 50</span>
          </div>
          <div className="text-xs text-slate-500 ml-auto">
            Data: Yahoo Finance • Updated live
          </div>
        </div>
      </div>
    </section>
  );
}

