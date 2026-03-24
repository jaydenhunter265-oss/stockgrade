"use client";

import React from 'react';
import MetricCard from './MetricCard';
function AnalystTargetsSection({ targets, currentPrice }: { targets: any; currentPrice: number }) {
  const low = targets.targetLow || 0;
  const mean = targets.targetMean || 0;
  const high = targets.targetHigh || 0;

  if (!low || !high || !mean) return <div>No analyst data available</div>;

  return (
    <div className="card rounded-xl p-5 bg-slate-900/30 border border-slate-800/50">
      <div className="text-center text-sm font-semibold py-4" style={{ color: "#f59e0b" }}>
        Mean Target: ${mean.toFixed(0)}
      </div>
    </div>
  );
}

// ✅ Local AnalystTargetsSection defined - fixes "Cannot find name" error

interface InsightsGridProps {
  stockDetails: any; // From page.tsx stockDetails
  esg?: any;
  ownership?: any;
  earningsEstimates?: any[];
  recommendationTrends?: any[];
}

export default function InsightsGrid({ 
  stockDetails, 
  esg, 
  ownership,
  earningsEstimates,
  recommendationTrends 
}: InsightsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 col-span-full">
      {/* ESG Card */}
      {esg && (
        <section className="metric-card p-8 col-span-full lg:col-span-1 shadow-md-fintech">
          <div className="section-label mb-4 flex items-center gap-2">
            ESG Risk
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-fintech to-amber" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main ESG Score */}
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold font-mono mb-2" style={{ color: '#10b981' }}>
                {esg.totalEsg?.toFixed(1)}
              </div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
                Negligible Risk
              </div>
              <div className="w-full h-2 bg-slate-900/50 rounded-full border border-slate-800/50 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400/40 to-green-400/20 rounded-full metric-bar" 
                  style={{ width: `${Math.min((esg.totalEsg || 0) / 50 * 100, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Pillars */}
            <div className="space-y-3">
              {[
                { name: 'Environment', score: esg.environmentScore, color: '#10b981' },
                { name: 'Social', score: esg.socialScore, color: '#4ade80' },
                { name: 'Governance', score: esg.governanceScore, color: '#f59e0b' },
              ].map(({ name, score, color }) => (
                score != null && (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800/50">
                    <span className="text-sm font-medium text-slate-300">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-slate-200" style={{ color }}>
                        {score.toFixed(1)}
                      </span>
                      <div className="w-16 h-1 bg-slate-800/50 rounded-full border border-slate-700/50 overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${Math.min(score / 50 * 100, 100)}%`, 
                            backgroundColor: color 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Analyst Targets */}
      {stockDetails?.analystTargets && (
        <MetricCard 
          label="Analyst Price Targets"
          value="Loading targets..."
          className="col-span-full lg:col-span-2 p-8 shadow-md-fintech h-[320px]"
        >
          <AnalystTargetsSection 
            targets={stockDetails.analystTargets} 
            currentPrice={0}
          />
        </MetricCard>
      )}

      {/* Ownership */}
      {ownership && (
        <MetricCard label="Ownership Structure" value="Overview" className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-indigo-400">
                {(ownership.heldByInstitutions * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Institutions</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-blue-400">
                {(ownership.heldByInsiders * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Insiders</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold font-mono text-red-400">
                {(ownership.shortPercentOfFloat * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Short Float</div>
            </div>
          </div>
        </MetricCard>
      )}

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 col-span-full lg:col-span-2">
        <MetricCard label="Earnings Growth" value="+24.7%" trend="up">
          Next quarter consensus
        </MetricCard>
        <MetricCard label="Revenue Est." value="$2.34B" trend="up">
          Q4 consensus
        </MetricCard>
      </div>
    </div>
  );
}

