import type { AiRating, MirofishGraphSignal, MirofishMeta } from "@/lib/types";

interface MirofishInput {
  ticker: string;
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
  if (upProbability >= 0.78) return { minDays: 5, maxDays: 20, label: "near-term breakout window" };
  if (upProbability >= 0.68) return { minDays: 10, maxDays: 35, label: "short-term upside window" };
  if (upProbability >= 0.58) return { minDays: 20, maxDays: 60, label: "medium-term upside window" };
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
  const combinedNorm = clamp(input.combinedScore / 100);
  const qualityNorm = clamp(input.qualityScore / 100);
  const growthNorm = clamp(input.growthScore / 100);
  const valueNorm = clamp(input.valueScore / 100);
  const technicalNorm = clamp(input.technicalPillarScore / 30);
  const sentimentNorm = clamp(input.sentimentPillarScore / 20);
  const riskNorm = clamp(input.riskPillarScore / 10);

  const weighted =
    0.42 * combinedNorm +
    0.14 * qualityNorm +
    0.12 * growthNorm +
    0.08 * valueNorm +
    0.14 * technicalNorm +
    0.1 * sentimentNorm +
    0.08 * riskNorm;

  return clamp(weighted, 0.05, 0.95);
}

async function fetchJSON(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
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
  const body = JSON.stringify({
    graph_id: MIROFISH_GRAPH_ID,
    query,
    limit,
  });
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

export async function getMirofishPrediction(input: MirofishInput): Promise<MirofishPrediction> {
  const simulated = simulatedSignal(input);
  const localBonus = simulated === "bullish" ? 3 : simulated === "bearish" ? -4 : 0;
  let upProbability = baseUpProbability(input);

  let backendReachable = false;
  let graphSignal: MirofishGraphSignal = { available: false, reason: "mirofish_disabled" };
  let graphBonus = 0;

  if (MIROFISH_ENABLED) {
    backendReachable = await isMirofishReachable();
    if (backendReachable) {
      graphSignal = await graphSentiment(input.ticker);
      if (graphSignal.available && typeof graphSignal.sentimentScore === "number") {
        upProbability = clamp(0.75 * upProbability + 0.25 * (0.5 + 0.5 * graphSignal.sentimentScore), 0.03, 0.97);
        graphBonus = Math.round(graphSignal.sentimentScore * 8);
      }
    } else {
      graphSignal = { available: false, reason: "mirofish_backend_unreachable" };
    }
  }

  const scoreAdjustment = localBonus + graphBonus;
  const mergedScore = clamp((input.combinedScore + scoreAdjustment) / 100, 0, 1);
  upProbability = clamp(0.6 * upProbability + 0.4 * mergedScore, 0.03, 0.97);

  const window = inferUpWindow(upProbability);
  const willGoUp = upProbability >= 0.58;

  const aiRating: AiRating = {
    score: Math.round(upProbability * 1000) / 10,
    label: toLabel(upProbability),
    willGoUp,
    upProbability: Math.round(upProbability * 1000) / 1000,
    horizonDays: 120,
    when: willGoUp
      ? {
          minDays: window.minDays,
          maxDays: window.maxDays,
          earliestDate: plusDaysISO(window.minDays),
          latestDate: plusDaysISO(window.maxDays),
          windowLabel: window.label,
        }
      : {
          expected: "not_likely_within_120_days",
          reevaluateAfterDays: 14,
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
    simulatedSignal: simulated,
    scoreAdjustment,
    graphSignal,
  };

  return { aiRating, mirofish };
}
