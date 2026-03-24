"use client";

import React, { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface LayoutContainerProps {
  children: ReactNode;
}

export default function LayoutContainer({ children }: LayoutContainerProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-black/90 to-slate-900/90">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-slate-900/50 supports-[backdrop-filter:blur(20px)]:bg-black/40">
        <div className="layout-container">
          <div className="flex items-center justify-between h-16 px-0">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                <span className="text-base font-bold text-indigo-300 drop-shadow-sm">S</span>
              </div>
              <div>
                <h1 className="text-base font-semibold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent tracking-tight">
                  StockGrade
                </h1>
                <span className="text-xs font-medium text-slate-500 tracking-wider">AI Stock Evaluator</span>
              </div>
            </div>

            {/* Desktop Search */}
            {!isHome && (
              <div className="hidden lg:flex flex-1 max-w-lg mx-8">
                {/* Search will be inserted via page-level component */}
                <div className="w-full h-11 bg-slate-900/50 border border-slate-700/50 rounded-2xl backdrop-blur-sm flex items-center px-4 text-slate-400 font-mono text-sm placeholder-slate-500 transition-all hover:border-slate-600/70 focus-within:border-indigo-400/60">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                  </svg>
                  <span>Search ticker...</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {!isHome && (
                <button className="btn-premium px-6 py-2 text-sm hidden md:block">
                  New Analysis
                </button>
              )}
              <div className="w-px h-5 bg-slate-700/50" />
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 layout-container py-8 lg:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-12 xl:gap-8 w-full">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900/50 bg-black/30 backdrop-blur-sm">
        <div className="layout-container py-8 text-xs text-slate-500 text-center">
          <p>
            © 2024 StockGrade. Data powered by Yahoo Finance.{' '}
            <span className="font-semibold text-slate-400">Not financial advice.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

