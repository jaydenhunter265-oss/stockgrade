"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RecentSim {
  ticker: string;
  projectId: string;
  companyName: string;
  createdAt: string;
}

function getRecentSims(): RecentSim[] {
  try {
    const stored = localStorage.getItem("mirofish-recent");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSim(sim: RecentSim) {
  try {
    const recent = getRecentSims().filter((s) => s.ticker !== sim.ticker);
    recent.unshift(sim);
    localStorage.setItem("mirofish-recent", JSON.stringify(recent.slice(0, 6)));
  } catch {}
}

export default function SimulatePage() {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "fetching" | "building">("idle");
  const [recentSims, setRecentSims] = useState<RecentSim[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecentSims(getRecentSims());
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sym = ticker.trim().toUpperCase();
    if (!sym) return;

    setLoading(true);
    setError("");
    setPhase("fetching");

    try {
      setPhase("building");
      const res = await fetch("/api/simulate/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: sym }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Simulation setup failed");
        setLoading(false);
        setPhase("idle");
        return;
      }

      addRecentSim({
        ticker: sym,
        projectId: json.data.project_id,
        companyName: json.data.company_name || sym,
        createdAt: new Date().toISOString(),
      });

      router.push(`/simulate/${json.data.project_id}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
      setPhase("idle");
    }
  }

  const phaseLabel =
    phase === "fetching"
      ? "Fetching market data…"
      : phase === "building"
      ? "Building intelligence model…"
      : "";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: "rgba(0,0,0,0.95)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0 group" style={{ textDecoration: "none" }}>
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              S
            </div>
            <span
              className="text-[13px] font-semibold tracking-tight hidden sm:block"
              style={{ color: "var(--text-muted)", letterSpacing: "-0.01em" }}
            >
              StockGrade
            </span>
          </a>

          {/* Nav tabs */}
          <div className="flex items-center gap-1 ml-2">
            <a
              href="/"
              className="text-[12px] font-medium px-3 py-1.5 rounded transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              Analyze
            </a>
            <span
              className="text-[12px] font-medium px-3 py-1.5 rounded"
              style={{
                color: "var(--accent)",
                background: "rgba(0,191,165,0.08)",
                border: "1px solid rgba(0,191,165,0.2)",
              }}
            >
              Simulate
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="/performance"
              className="text-[11px] font-semibold px-3 py-1.5 rounded transition-colors hover:brightness-110 hidden sm:block"
              style={{ color: "#3b82f6", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}
            >
              Performance
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative flex-1 flex flex-col items-center justify-start pt-16 sm:pt-24 pb-16 px-4">
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,191,165,0.05) 0%, transparent 65%)" }}
        />

        <div className="relative z-10 w-full max-w-[580px] flex flex-col items-center">
          {/* Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] mb-6"
            style={{
              background: "rgba(0,191,165,0.08)",
              border: "1px solid rgba(0,191,165,0.2)",
              color: "var(--accent)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "inline-block",
                boxShadow: "0 0 6px var(--accent)",
              }}
            />
            MiroFish AI Engine
          </div>

          {/* Headline */}
          <h1
            className="text-[28px] sm:text-[36px] font-black text-center leading-[1.1] mb-3"
            style={{ color: "var(--text)", letterSpacing: "-0.02em" }}
          >
            Simulate the Future
            <span style={{ color: "var(--accent)" }}> of Any Stock</span>
          </h1>

          <p className="text-[14px] text-center mb-10 max-w-[420px]" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Enter a ticker to launch a multi-agent AI simulation. Market participants — analysts, investors, media, short sellers — debate the stock&apos;s future in real time.
          </p>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <div
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[13px] font-mono font-semibold"
                  style={{ color: "var(--accent)", opacity: 0.6 }}
                >
                  $
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={ticker}
                  onChange={(e) => {
                    setTicker(e.target.value.toUpperCase().replace(/[^A-Z.]/g, ""));
                    setError("");
                  }}
                  placeholder="AAPL, TSLA, NVDA…"
                  maxLength={10}
                  disabled={loading}
                  className="w-full pl-8 pr-4 py-3.5 rounded-xl text-[15px] font-mono placeholder:text-zinc-600 transition-all focus:outline-none disabled:opacity-50"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    letterSpacing: "0.05em",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="px-6 py-3.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-40 flex-shrink-0"
                style={{
                  background: "var(--accent)",
                  color: "#000",
                  border: "none",
                  cursor: loading || !ticker.trim() ? "not-allowed" : "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(0,0,0,0.3)",
                        borderTopColor: "#000",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Running
                  </span>
                ) : (
                  "Simulate →"
                )}
              </button>
            </div>

            {/* Phase indicator */}
            {loading && phaseLabel && (
              <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    animation: "pulse 1.2s ease-in-out infinite",
                  }}
                />
                {phaseLabel}
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-3 px-4 py-2.5 rounded-lg text-[12px]"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                {error}
              </div>
            )}
          </form>

          {/* How it works */}
          <div className="w-full mt-10 grid grid-cols-3 gap-3">
            {[
              { step: "01", label: "Market Data", desc: "Fetches live financials & news" },
              { step: "02", label: "Agent Debate", desc: "AI agents simulate market reactions" },
              { step: "03", label: "Prediction", desc: "Generates sentiment & price outlook" },
            ].map(({ step, label, desc }) => (
              <div
                key={step}
                className="rounded-xl p-4 text-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="text-[10px] font-mono mb-1.5" style={{ color: "var(--accent)", opacity: 0.7 }}>
                  {step}
                </div>
                <div className="text-[12px] font-bold mb-1" style={{ color: "var(--text)" }}>
                  {label}
                </div>
                <div className="text-[10px] leading-[1.4]" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          {/* Recent simulations */}
          {recentSims.length > 0 && (
            <div className="w-full mt-8">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: "var(--text-dim)" }}>
                Recent Simulations
              </div>
              <div className="flex flex-col gap-2">
                {recentSims.map((sim) => (
                  <a
                    key={sim.projectId}
                    href={`/simulate/${sim.projectId}`}
                    className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[12px] font-mono font-bold px-2 py-0.5 rounded"
                        style={{ background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
                      >
                        {sim.ticker}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        {sim.companyName}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                      {new Date(sim.createdAt).toLocaleDateString()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
