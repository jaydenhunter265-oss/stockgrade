"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  children?: React.ReactNode;
}

export default function MetricCard({
  label,
  value,
  sub,
  trend,
  className,
  children,
}: MetricCardProps) {
  const trendIcon = trend === 'up' ? '↗' : trend === 'down' ? '↘' : '';

  return (
    <div className={cn(
      "metric-card group cursor-default h-full transition-all duration-200 hover:shadow-lg-fintech hover:-translate-y-0.5",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="metric-label">{label}</div>
        {trend && (
          <span className={`text-sm font-bold ${trend === 'up' ? 'text-green-fintech' : 'text-red-fintech'}`}>
            {trendIcon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <div className="metric-value">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {children}
      </div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

