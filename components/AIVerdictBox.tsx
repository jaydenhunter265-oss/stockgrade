"use client";

import React from 'react';

interface AIVerdictBoxProps {
  qualityScore: number;
  growthScore: number;
  valueScore: number;
  combinedScore: number;
  rating: string;
  ratingColor: string;
  totalBuy: number;
  totalSell: number;
  totalMetrics: number;
  verdictText: string;
}

export default function AIVerdictBox({
  qualityScore,
  growthScore,
  valueScore,
  combinedScore,
  rating,
  ratingColor,
  totalBuy,
  totalSell,
  totalMetrics,
  verdictText,
}: AIVerdictBoxProps) {
  const icon = combinedScore >= 75 ? '⭐' : combinedScore >= 55 ? '📈' : combinedScore >= 35 ? '⚖️' : '⚠️';

  const scores = [
    { label: "Quality", score: qualityScore, color: "#10b981" },
    { label: "Growth",  score: growthScore,  color: "#3b82f6" },
    { label: "Value",   score: valueScore,   color: "#a78bfa" },
    { label: "Combined", score: combinedScore, color: ratingColor },
  ];

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
              <span className="px-3 py-1 bg-gradient-to-r from-slate-700/30 to-slate-800/20 backdrop-blur text-xs font-bold rounded-full border border-slate-700/40" style={{ color: ratingColor }}>
                {rating}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
              {verdictText}
            </p>
          </div>
        </div>

        {/* 4 Score Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {scores.map(({ label, score, color }) => (
            <div
              key={label}
              className="rounded-xl p-4 text-center"
              style={{ background: color + "0d", border: `1px solid ${color}28` }}
            >
              <div className="text-[26px] font-black font-mono leading-none" style={{ color }}>{score}</div>
              <div className="text-[8px] opacity-30 font-mono leading-none mt-0.5" style={{ color }}>/100</div>
              <div className="text-[9px] font-bold uppercase tracking-wider mt-1.5" style={{ color }}>{label}</div>
            </div>
          ))}
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
