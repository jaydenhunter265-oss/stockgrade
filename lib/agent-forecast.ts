import type {
  PillarScore,
  AgentForecastOutput,
  TrendAgentOutput,
  FundamentalsAgentOutput,
  SentimentAgentOutput,
  RiskAgentOutput,
  MacroAgentOutput,
  ForecastScenario,
} from "./types";

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

function countBulletSentiments(bullets: PillarScore["bullets"]) {
  let pos = 0, neg = 0;
  for (const b of bullets) {
    if (b.sentiment === "positive") pos++;
    else if (b.sentiment === "negative") neg++;
  }
  return { pos, neg };
}

function topBulletText(bullets: PillarScore["bullets"], count = 2): string {
  return bullets
    .slice(0, count)
    .map((b) => b.text)
    .join(" · ");
}

/* ─────────────────────────────────────────
   AGENT 1 — TREND
   Input: technicalScore pillar (0–30)
   Signals: SMA bullets, volume, 52-week range
───────────────────────────────────────── */
function runTrendAgent(techScore: PillarScore): TrendAgentOutput {
  const trend_strength = clamp(techScore.score / techScore.maxScore);
  const { pos, neg } = countBulletSentiments(techScore.bullets);

  const trend_direction: TrendAgentOutput["trend_direction"] =
    pos >= 2 && pos > neg ? "bullish"
    : neg >= 2 && neg > pos ? "bearish"
    : "neutral";

  const explanation =
    techScore.bullets.length > 0
      ? topBulletText(techScore.bullets)
      : `Technical strength at ${Math.round(trend_strength * 100)}%`;

  return { trend_direction, trend_strength, explanation };
}

/* ─────────────────────────────────────────
   AGENT 2 — FUNDAMENTALS
   Input: fundamentalsScore pillar (0–40), valueScore (0–100)
   Signals: margins, ROE, revenue growth, current ratio
───────────────────────────────────────── */
function runFundamentalsAgent(
  fundScore: PillarScore,
  valueScore: number
): FundamentalsAgentOutput {
  const fundamental_score = clamp(fundScore.score / fundScore.maxScore);

  const valuation_label: FundamentalsAgentOutput["valuation_label"] =
    valueScore >= 65 ? "undervalued"
    : valueScore <= 35 ? "overvalued"
    : "fair";

  const explanation =
    fundScore.bullets.length > 0
      ? topBulletText(fundScore.bullets)
      : `Fundamental score: ${Math.round(fundamental_score * 100)}%`;

  return { fundamental_score, valuation_label, explanation };
}

/* ─────────────────────────────────────────
   AGENT 3 — SENTIMENT
   Input: sentimentScore pillar (0–20)
   Signals: buy/sell signal ratio, earnings growth
───────────────────────────────────────── */
function runSentimentAgent(sentScore: PillarScore): SentimentAgentOutput {
  const sentiment_score = clamp(sentScore.score / sentScore.maxScore);

  const sentiment: SentimentAgentOutput["sentiment"] =
    sentiment_score >= 0.60 ? "bullish"
    : sentiment_score <= 0.40 ? "bearish"
    : "neutral";

  const explanation =
    sentScore.bullets.length > 0
      ? topBulletText(sentScore.bullets, 1)
      : `Sentiment score: ${Math.round(sentiment_score * 100)}%`;

  return { sentiment, sentiment_score, explanation };
}

/* ─────────────────────────────────────────
   AGENT 4 — RISK
   Input: riskScore pillar (0–10), beta
   Signals: volatility, debt/equity, market cap, net debt
───────────────────────────────────────── */
function runRiskAgent(riskScore: PillarScore, beta: number): RiskAgentOutput {
  // Annual vol as proxy: beta 1.0 → 21%, beta 2.0 → 37%
  const annualVol = clamp(Math.abs(beta) * 0.16 + 0.05, 0.08, 0.65);
  // Volatility score: beta 0 → 0, beta 2.5 → 1.0
  const volatility_score = clamp(Math.abs(beta) * 0.40);
  // Quarterly downside (1-sigma, 3-month horizon)
  const downside_risk_pct = Number((annualVol * Math.sqrt(0.25) * 100).toFixed(1));

  const risk_level: RiskAgentOutput["risk_level"] =
    riskScore.score >= 7 && volatility_score < 0.50 ? "low"
    : riskScore.score <= 3 || volatility_score > 0.70 ? "high"
    : "medium";

  const explanation =
    riskScore.bullets.length > 0
      ? topBulletText(riskScore.bullets)
      : `${risk_level.charAt(0).toUpperCase() + risk_level.slice(1)} risk · ${downside_risk_pct}% quarterly downside`;

  return { risk_level, volatility_score, downside_risk_pct, explanation };
}

/* ─────────────────────────────────────────
   AGENT 5 — MACRO (sector proxy)
   Input: sector string, combinedScore (0–100)
   Logic: defensive/growth sector adjustments on top of combined score
───────────────────────────────────────── */
function runMacroAgent(sector: string, combinedScore: number): MacroAgentOutput {
  const combined01 = combinedScore / 100;
  const isDefensive = /utilities|healthcare|consumer staples|real estate/i.test(sector);
  const isGrowth = /tech|software|semiconductor|communication|consumer cyclical|financial/i.test(sector);

  let macro_score: number;
  if (isDefensive) {
    macro_score = combined01 > 0.60 ? 0.68 : 0.50;
  } else if (isGrowth) {
    macro_score = combined01 > 0.60 ? 0.72 : 0.52;
  } else {
    // cyclical/other: linearly tracks combined score
    macro_score = clamp(0.45 + combined01 * 0.20);
  }

  const macro_bias: MacroAgentOutput["macro_bias"] =
    macro_score >= 0.62 ? "bullish"
    : macro_score <= 0.48 ? "bearish"
    : "neutral";

  const sectorLabel = sector || "Broad market";
  const explanation =
    macro_bias === "bullish"
      ? `${sectorLabel} sector conditions favorable · Fundamental backdrop supports upside`
      : macro_bias === "bearish"
      ? `${sectorLabel} sector facing headwinds · Mixed macro conditions`
      : `${sectorLabel} sector in neutral territory · Macro conditions balanced`;

  return { macro_bias, macro_score, explanation };
}

/* ─────────────────────────────────────────
   AGGREGATION — Weighted composite score
   Weights: Trend 30%, Fundamentals 25%, Sentiment 20%, Risk 15%, Macro 10%
───────────────────────────────────────── */
function computeComposite(
  trend: TrendAgentOutput,
  fundamentals: FundamentalsAgentOutput,
  sentiment: SentimentAgentOutput,
  risk: RiskAgentOutput,
  macro: MacroAgentOutput
): number {
  // For risk: lower volatility → higher contribution (inverted)
  const riskContribution = 1 - risk.volatility_score;
  return clamp(
    0.30 * trend.trend_strength +
    0.25 * fundamentals.fundamental_score +
    0.20 * sentiment.sentiment_score +
    0.15 * riskContribution +
    0.10 * macro.macro_score
  );
}

function compositeLabel(score: number): AgentForecastOutput["composite_label"] {
  if (score >= 0.75) return "very_bullish";
  if (score >= 0.60) return "bullish";
  if (score >= 0.40) return "neutral";
  if (score >= 0.25) return "bearish";
  return "very_bearish";
}

/* ─────────────────────────────────────────
   SCENARIO GENERATOR
   5 structured outcomes with realistic price bounds constrained by vol
───────────────────────────────────────── */
function buildScenarios(
  price: number,
  composite: number,
  annualVol: number
): ForecastScenario[] {
  const direction = (composite - 0.5) * 2; // maps [0,1] → [-1,+1]

  // Price targets for each scenario (1-year horizon, vol-constrained)
  const targets = [
    price * (1 + annualVol * 1.50),                     // Strong Bull
    price * (1 + annualVol * 0.70),                     // Moderate Bull
    price * (1 + direction * annualVol * 0.15),         // Neutral (slight directional tilt)
    price * (1 - annualVol * 0.55),                     // Bearish
    price * (1 - annualVol * 1.20),                     // Extreme Bearish
  ];

  // Raw probabilities driven by composite score
  const comp2 = composite * composite;
  const inv2 = (1 - composite) * (1 - composite);
  const raw = [
    comp2 * 30,                               // Strong Bull: rises sharply when composite is high
    composite * 35,                           // Moderate Bull: linearly tracks composite
    (1 - Math.abs(direction)) * 25 + 10,      // Neutral: highest when composite ≈ 0.5
    (1 - composite) * 30,                     // Bearish: rises as composite falls
    inv2 * 20,                                // Extreme Bearish: rises sharply at low composite
  ];

  // Normalize to sum to 100 (enforce min 2% per scenario)
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const probs = raw.map((p) => Math.max(2, Math.round((p / rawSum) * 100)));
  const probSum = probs.reduce((a, b) => a + b, 0);
  probs[2] = Math.max(2, probs[2] + (100 - probSum)); // absorb rounding drift into Neutral

  const defs: Array<{ label: ForecastScenario["label"]; desc: string }> = [
    { label: "Strong Bull",     desc: "Fundamental catalysts accelerate beyond consensus expectations" },
    { label: "Moderate Bull",   desc: "Sustained growth continues with positive price momentum" },
    { label: "Neutral",         desc: "Range-bound trading — macro uncertainty caps gains and losses" },
    { label: "Bearish",         desc: "Earnings miss or macro headwinds dampen performance" },
    { label: "Extreme Bearish", desc: "Significant downside materializes — risk-off environment" },
  ];

  return defs.map(({ label, desc }, i) => ({
    label,
    priceTarget: Math.round(targets[i] * 100) / 100,
    returnPct: Math.round(((targets[i] - price) / price) * 1000) / 10,
    probability: probs[i],
    description: desc,
  }));
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */

export interface AgentForecastInput {
  technicalScore: PillarScore;
  fundamentalsScore: PillarScore;
  sentimentScore: PillarScore;
  riskScore: PillarScore;
  valueScore: number;    // 0–100
  combinedScore: number; // 0–100
  sector: string;
  beta: number;
  price: number;
}

export function computeAgentForecast(input: AgentForecastInput): AgentForecastOutput {
  const trend        = runTrendAgent(input.technicalScore);
  const fundamentals = runFundamentalsAgent(input.fundamentalsScore, input.valueScore);
  const sentiment    = runSentimentAgent(input.sentimentScore);
  const risk         = runRiskAgent(input.riskScore, input.beta);
  const macro        = runMacroAgent(input.sector, input.combinedScore);

  const composite_score = computeComposite(trend, fundamentals, sentiment, risk, macro);
  const annualVol = clamp(Math.abs(input.beta) * 0.16 + 0.05, 0.08, 0.65);
  const direction = (composite_score - 0.5) * 2;

  // Expected 1-year return (direction-weighted, volatility-scaled)
  const expectedReturn = direction * annualVol * 0.80;
  const base_case = Math.round(input.price * (1 + expectedReturn) * 100) / 100;
  const bull_case = Math.round(input.price * (1 + expectedReturn + annualVol * 0.65) * 100) / 100;
  const bear_case = Math.round(input.price * (1 + expectedReturn - annualVol * 0.65) * 100) / 100;

  // Confidence: high composite + low vol = higher confidence
  const confidence = Math.round(
    clamp(composite_score * 0.70 + (1 - annualVol) * 0.30) * 100
  );

  const scenarios = buildScenarios(input.price, composite_score, annualVol);

  const dirLabel = composite_score >= 0.60 ? "bullish" : composite_score <= 0.40 ? "bearish" : "neutral";
  const explanation =
    `Agent consensus is ${dirLabel} with ${confidence}% confidence. ` +
    `Trend is ${trend.trend_direction}, fundamentals are ${fundamentals.valuation_label}, ` +
    `risk is ${risk.risk_level}, and market sentiment is ${sentiment.sentiment}.`;

  return {
    agents: { trend, fundamentals, sentiment, risk, macro },
    composite_score: Math.round(composite_score * 1000) / 1000,
    composite_label: compositeLabel(composite_score),
    bear_case,
    base_case,
    bull_case,
    confidence,
    annual_volatility: Math.round(annualVol * 1000) / 1000,
    scenarios,
    explanation,
  };
}
