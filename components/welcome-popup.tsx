"use client";

import { useState, useEffect } from "react";

export default function WelcomePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("stockgrade_welcome_dismissed");
    if (!dismissed) setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem("stockgrade_welcome_dismissed", "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="relative w-full max-w-lg rounded-2xl p-8 animate-fade-in"
        style={{ background: "#141414", border: "1px solid #262626" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
          >
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#fafafa" }}>StockGrade</h1>
            <p className="text-sm" style={{ color: "#a1a1aa" }}>Professional Stock Evaluator</p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-6 leading-relaxed" style={{ color: "#d4d4d8" }}>
          Get instant <strong style={{ color: "#22c55e" }}>Buy</strong> /{" "}
          <strong style={{ color: "#f59e0b" }}>Hold</strong> /{" "}
          <strong style={{ color: "#ef4444" }}>Sell</strong> ratings for any stock using{" "}
          <strong style={{ color: "#fafafa" }}>350+ quantitative metrics</strong> used by professional investors and fund managers.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: "1", label: "Valuation Analysis", desc: "P/E, EV/EBITDA, DCF signals" },
            { icon: "2", label: "Profitability Check", desc: "ROE, ROIC, margin trends" },
            { icon: "3", label: "Growth Metrics", desc: "Revenue, EPS, FCF growth" },
            { icon: "4", label: "Risk Assessment", desc: "Debt, liquidity, volatility" },
          ].map((f) => (
            <div
              key={f.icon}
              className="rounded-lg p-3"
              style={{ background: "#1a1a1a", border: "1px solid #262626" }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: "#3b82f6" }}>
                {f.label}
              </div>
              <div className="text-xs" style={{ color: "#71717a" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-xs mb-6" style={{ color: "#71717a" }}>
          For informational purposes only. Not financial advice. Always consult a licensed financial advisor before making investment decisions.
        </p>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full py-3 rounded-xl font-semibold text-white text-base cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
        >
          Start Evaluating Stocks
        </button>
      </div>
    </div>
  );
}
