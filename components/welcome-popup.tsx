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

  const features = [
    { icon: "V", label: "Valuation Analysis", desc: "P/E, EV/EBITDA, DCF, Graham Number", color: "#0a84ff" },
    { icon: "P", label: "Profitability", desc: "ROE, ROIC, margins, cash returns", color: "#30d158" },
    { icon: "G", label: "Growth Metrics", desc: "Revenue, EPS, FCF compound growth", color: "#bf5af2" },
    { icon: "R", label: "Risk Assessment", desc: "Debt ratios, beta, liquidity checks", color: "#ff453a" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl p-8 animate-fade-in-scale"
        style={{
          background: "linear-gradient(180deg, #111111 0%, #0a0a0a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(10, 132, 255, 0.05)",
        }}
      >
        {/* Decorative gradient line at top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-32 rounded-full"
          style={{ background: "var(--accent-gradient)" }}
        />

        {/* Logo + Title */}
        <div className="flex items-center gap-4 mb-7 mt-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white animate-gradient"
            style={{ background: "var(--accent-gradient)", backgroundSize: "200% 200%" }}
          >
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#f5f5f7" }}>
              StockGrade
            </h1>
            <p className="text-sm font-medium" style={{ color: "#8e8e93" }}>
              Institutional-Grade Analysis
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mb-7 leading-relaxed text-[15px]" style={{ color: "#a1a1a6" }}>
          Get instant{" "}
          <span className="font-semibold" style={{ color: "#30d158" }}>Buy</span>
          {" / "}
          <span className="font-semibold" style={{ color: "#ffd60a" }}>Hold</span>
          {" / "}
          <span className="font-semibold" style={{ color: "#ff453a" }}>Sell</span>
          {" "}ratings powered by{" "}
          <span className="font-semibold" style={{ color: "#f5f5f7" }}>350+ quantitative metrics</span>
          {" "}used by professional investors and fund managers.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-7">
          {features.map((f) => (
            <div
              key={f.icon}
              className="rounded-2xl p-3.5 transition-colors"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mb-2"
                style={{ background: f.color + "18", color: f.color }}
              >
                {f.icon}
              </div>
              <div className="text-[13px] font-semibold mb-0.5" style={{ color: "#f5f5f7" }}>
                {f.label}
              </div>
              <div className="text-[11px] leading-snug" style={{ color: "#636366" }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] mb-6 leading-relaxed" style={{ color: "#48484a" }}>
          For informational and educational purposes only. Not financial advice.
          Always consult a licensed financial advisor before making investment decisions.
        </p>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full py-3.5 rounded-2xl font-semibold text-white text-[15px] cursor-pointer transition-all btn-glow animate-gradient"
          style={{
            background: "var(--accent-gradient)",
            backgroundSize: "200% 200%",
            boxShadow: "0 4px 20px rgba(10, 132, 255, 0.2)",
          }}
        >
          Start Evaluating
        </button>
      </div>
    </div>
  );
}
