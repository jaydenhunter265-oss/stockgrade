import type { AiRating, MirofishGraphSignal, MirofishMeta, MirofishSimulation } from "@/lib/types";

interface MirofishInput {
  ticker: string;
  price: number;          // current stock price — required for simulation
  beta: number;           // stock beta — used for volatility estimate
  combinedScore: number;
  qualityScore: number;
  growthScore: number;
  valueScore: number;
  technicalPillarScore: number;
  sentimentPillarScore: number;
  riskPillarScore: number;
}

interface MirofishPrediction {
  aiRating: AiRating;
  mirofish: MirofishMeta;
}

const MIROFISH_API_URL = (process.env.MIROFISH_API_URL || "http://localhost:5001").replace(/\/+$/, "");
const MIROFISH_GRAPH_ID = process.env.MIROFISH_GRAPH_ID || "";
const MIROFISH_ENABLED = process.env.MIROFISH_ENABLED !== "false";
const HEALTH_TTL_MS = 30_000;

let cachedHealth: { checkedAt: number; reachable: boolean } | null = null;

const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value));

function plusDaysISO(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function inferUpWindow(upProbability: number) {
  if (upProbability >= 0.78) return { minDays: 5,  maxDays: 20,  label: "near-term breakout window" };
  if (upProbability >= 0.68) return { minDays: 10, maxDays: 35,  label: "short-term upside window" };
  if (upProbability >= 0.58) return { minDays: 20, maxDays: 60,  label: "medium-term upside window" };
  return { minDays: 60, maxDays: 120, label: "low-confidence upside window" };
}

function toLabel(upProbability: number): AiRating["label"] {
  if (upProbability >= 0.78) return "very_bullish";
  if (upProbability >= 0.68) return "bullish";
  if (upProbability >= 0.58) return "slightly_bullish";
  if (upProbability >= 0.45) return "neutral_to_bearish";
  return "bearish";
}

function simulatedSignal(input: MirofishInput): "bullish" | "neutral" | "bearish" {
  const technicalNorm = clamp(input.technicalPillarScore / 30);
  const sentimentNorm = clamp(input.sentimentPillarScore / 20);
  const blended = 0.55 * (input.combinedScore / 100) + 0.25 * technicalNorm + 0.2 * sentimentNorm;
  if (blended >= 0.68) return "bullish";
  if (blended <= 0.42) return "bearish";
  return "neutral";
}

function baseUpProbability(input: MirofishInput) {
  const combinedNorm  = clamp(input.combinedScore / 100);
  const qualityNorm   = clamp(input.qualityScore / 100);
  const growthNorm    = clamp(input.growthScore / 100);
  const valueNorm     = clamp(input.valueScore / 100);
  const technicalNorm = clamp(input.technicalPillarScore / 30);
  const sentimentNorm = clamp(input.sentimentPillarScore / 20);
  const riskNorm      = clamp(input.riskPillarScore / 10);

  const weighted =
    0.42 * combinedNorm +
    0.14 * qualityNorm +
    0.12 * growthNorm +
    0.08 * valueNorm +
    0.14 * technicalNorm +
    0.10 * sentimentNorm +
    0.08 * riskNorm;

  return clamp(weighted, 0.05, 0.95);
}

/* ══════════════════════════════════════════════════════════════════
   GBM MONTE CARLO SIMULATION
   ──────────────────────────────────────────────────────────────────
   Model: Geometric Brownian Motion
     S(t+dt) = S(t) * exp((μ - σ²/2) * dt + σ * √dt * Z)

   Where:
     μ  = annual drift derived from composite scoring signals
     σ  = annual volatility estimated from beta
     dt = 1/252 (one trading day)
     Z  ~ N(0,1) standard normal via Box-Muller

   Output percentiles:
     10th = bear case  |  50th = base (median)  |  90th = bull case
═══════════════════════════════════════════════════════════════════ */

/** Box-Muller transform — produces one standard normal sample */
function sampleNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Percentile of a sorted array (linear interpolation) */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = p * (sorted.length - 1);
  const lo  = Math.floor(idx);
  const hi  = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Compute annualized drift (μ) from scoring inputs.
 *
 * Mapping:
 *   compositeProb 0.5 (neutral) → ~0% drift
 *   compositeProb 0.8 (bullish) → ~+14% annual
 *   compositeProb 0.2 (bearish) → ~-14% annual
 *
 * Additional adjustments:
 *   qualityScore: high-quality companies trend better (+/- 2%)
 *   growthScore:  fast growers get modest boost (+/- 3%)
 */
function computeDrift(input: MirofishInput, compositeProb: number): number {
  // Core drift from composite probability
  const coreDrift = (compositeProb - 0.50) * 2.0 * 0.18; // maps [-1,+1] → [-18%,+18%]

  // Quality adjustment: ROIC/margins quality score
  const qualityAdj = (clamp(input.qualityScore / 100) - 0.50) * 0.04;

  // Growth adjustment: revenue/earnings growth score
  const growthAdj = (clamp(input.growthScore / 100) - 0.50) * 0.06;

  // Risk adjustment: penalise high-risk (low riskPillarScore)
  const riskPenalty = -(1.0 - clamp(input.riskPillarScore / 10)) * 0.03;

  return coreDrift + qualityAdj + growthAdj + riskPenalty;
}

/**
 * Compute annualized volatility (σ) from beta.
 *
 *   beta 0.5 → ~13%   (low vol)
 *   beta 1.0 → ~21%   (market-like)
 *   beta 1.5 → ~29%   (elevated)
 *   beta 2.0 → ~37%   (high vol)
 *   clamped to [8%, 65%]
 */
function computeVol(beta: number): number {
  return clamp(Math.abs(beta) * 0.16 + 0.05, 0.08, 0.65);
}

/**
 * Run N=1000 GBM paths over 252 trading days.
 * Records prices at day 63 (3M) and day 252 (1Y).
 */
function runMonteCarloSimulation(
  price: number,
  drift: number,
  vol: number,
  nPaths = 1000
): MirofishSimulation {
  const T_YEAR  = 252;
  const T_3M    = 63;
  const dt      = 1 / T_YEAR;
  const sqrtDt  = Math.sqrt(dt);
  const logDrift = (drift - 0.5 * vol * vol) * dt; // pre-compute constant part

  const prices3M: number[] = new Array(nPaths);
  const prices1Y: number[] = new Array(nPaths);

  for (let i = 0; i < nPaths; i++) {
    let s = price;

    for (let day = 1; day <= T_YEAR; day++) {
      s = s * Math.exp(logDrift + vol * sqrtDt * sampleNormal());
      if (day === T_3M) prices3M[i] = s;
    }

    prices1Y[i] = s;
  }

  prices3M.sort((a, b) => a - b);
  prices1Y.sort((a, b) => a - b);

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const round1 = (n: number) => Math.round(n * 10) / 10;

  const probUp3m = round1(prices3M.filter(p => p > price).length / nPaths * 100);
  const probUp1y = round1(prices1Y.filter(p => p > price).length / nPaths * 100);

  return {
    bear_3m:    round2(percentile(prices3M, 0.10)),
    base_3m:    round2(percentile(prices3M, 0.50)),
    bull_3m:    round2(percentile(prices3M, 0.90)),
    bear_1y:    round2(percentile(prices1Y, 0.10)),
    base_1y:    round2(percentile(prices1Y, 0.50)),
    bull_1y:    round2(percentile(prices1Y, 0.90)),
    prob_up_3m: probUp3m,
    prob_up_1y: probUp1y,
    drift:      Math.round(drift * 10000) / 100, // store as % (e.g. 12.35)
    annual_vol: Math.round(vol * 10000) / 100,   // store as % (e.g. 24.50)
    n_paths:    nPaths,
  };
}

/* ═══════════════════ External API helpers ═══════════════════ */

async function fetchJSON(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function isMirofishReachable() {
  if (cachedHealth && Date.now() - cachedHealth.checkedAt < HEALTH_TTL_MS) {
    return cachedHealth.reachable;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    await fetchJSON(`${MIROFISH_API_URL}/health`, { signal: controller.signal });
    cachedHealth = { checkedAt: Date.now(), reachable: true };
    return true;
  } catch {
    cachedHealth = { checkedAt: Date.now(), reachable: false };
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchGraph(query: string, limit = 25): Promise<{ total_count?: number } | null> {
  if (!MIROFISH_GRAPH_ID) return null;
  const body = JSON.stringify({ graph_id: MIROFISH_GRAPH_ID, query, limit });
  const payload = (await fetchJSON(`${MIROFISH_API_URL}/api/report/tools/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })) as { data?: { total_count?: number } };
  return payload.data ?? null;
}

async function graphSentiment(ticker: string): Promise<MirofishGraphSignal> {
  if (!MIROFISH_GRAPH_ID) {
    return { available: false, reason: "MIROFISH_GRAPH_ID not configured" };
  }
  try {
    const [bull, bear] = await Promise.all([
      searchGraph(`${ticker} bullish rally upside gain positive momentum`),
      searchGraph(`${ticker} bearish downside drop risk weak negative`),
    ]);
    const bullCount = bull?.total_count ?? 0;
    const bearCount = bear?.total_count ?? 0;
    const sentiment = (bullCount - bearCount) / (bullCount + bearCount + 1);
    return {
      available: true,
      bullEvidence: bullCount,
      bearEvidence: bearCount,
      sentimentScore: Number(sentiment.toFixed(3)),
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "graph_search_failed",
    };
  }
}

/* ═══════════════════ Main export ═══════════════════ */

export async function getMirofishPrediction(input: MirofishInput): Promise<MirofishPrediction> {
  const simSignal  = simulatedSignal(input);
  const localBonus = simSignal === "bullish" ? 3 : simSignal === "bearish" ? -4 : 0;
  let upProbability = baseUpProbability(input);

  let backendReachable = false;
  let graphSignal: MirofishGraphSignal = { available: false, reason: "mirofish_disabled" };
  let graphBonus = 0;

  if (MIROFISH_ENABLED) {
    backendReachable = await isMirofishReachable();
    if (backendReachable) {
      graphSignal = await graphSentiment(input.ticker);
      if (graphSignal.available && typeof graphSignal.sentimentScore === "number") {
        upProbability = clamp(
          0.75 * upProbability + 0.25 * (0.5 + 0.5 * graphSignal.sentimentScore),
          0.03, 0.97
        );
        graphBonus = Math.round(graphSignal.sentimentScore * 8);
      }
    } else {
      graphSignal = { available: false, reason: "mirofish_backend_unreachable" };
    }
  }

  const scoreAdjustment = localBonus + graphBonus;
  const mergedScore = clamp((input.combinedScore + scoreAdjustment) / 100, 0, 1);
  upProbability = clamp(0.6 * upProbability + 0.4 * mergedScore, 0.03, 0.97);

  // ── Monte Carlo GBM Simulation ──
  const drift     = computeDrift(input, upProbability);
  const annualVol = computeVol(input.beta);
  const simulation = runMonteCarloSimulation(input.price, drift, annualVol);

  // Use simulation's prob_up_1y to fine-tune the AI rating probability
  const simProb1Y = simulation.prob_up_1y / 100; // convert % → fraction
  const finalProb = clamp(0.65 * upProbability + 0.35 * simProb1Y, 0.03, 0.97);

  const window   = inferUpWindow(finalProb);
  const willGoUp = finalProb >= 0.58;

  const aiRating: AiRating = {
    score:         Math.round(finalProb * 1000) / 10,
    label:         toLabel(finalProb),
    willGoUp,
    upProbability: Math.round(finalProb * 1000) / 1000,
    horizonDays:   120,
    when: willGoUp
      ? {
          minDays:      window.minDays,
          maxDays:      window.maxDays,
          earliestDate: plusDaysISO(window.minDays),
          latestDate:   plusDaysISO(window.maxDays),
          windowLabel:  window.label,
        }
      : {
          expected:              "not_likely_within_120_days",
          reevaluateAfterDays:   14,
        },
  };

  const note = MIROFISH_ENABLED
    ? backendReachable
      ? "MiroFish backend reachable. Graph evidence was blended when available."
      : "MiroFish backend not reachable. Local quantitative fallback was used."
    : "MiroFish integration disabled via MIROFISH_ENABLED=false.";

  const mirofish: MirofishMeta = {
    enabled: MIROFISH_ENABLED,
    backendReachable,
    graphIdConfigured: Boolean(MIROFISH_GRAPH_ID),
    note,
    simulatedSignal: simSignal,
    scoreAdjustment,
    graphSignal,
    simulation,
  };

  return { aiRating, mirofish };
}
