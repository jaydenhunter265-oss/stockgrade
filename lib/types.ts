export interface CompanyProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  mktCap: number;
  price: number;
  changes: number;
  changesPercentage: number;
  exchange: string;
  description: string;
  image: string;
  currency: string;
  country: string;
  ipoDate: string;
  isActivelyTrading: boolean;
  beta: number;
  volAvg: number;
  lastDiv: number;
  range: string;
}

export interface FinancialRatios {
  peRatioTTM: number;
  pegRatioTTM: number;
  priceToBookRatioTTM: number;
  priceToSalesRatioTTM: number;
  priceToFreeCashFlowsRatioTTM: number;
  priceEarningsToGrowthRatioTTM: number;
  enterpriseValueOverEBITDATTM: number;
  priceCashFlowRatioTTM: number;
  debtEquityRatioTTM: number;
  debtRatioTTM: number;
  currentRatioTTM: number;
  quickRatioTTM: number;
  cashRatioTTM: number;
  interestCoverageTTM: number;
  grossProfitMarginTTM: number;
  operatingProfitMarginTTM: number;
  netProfitMarginTTM: number;
  returnOnEquityTTM: number;
  returnOnAssetsTTM: number;
  returnOnCapitalEmployedTTM: number;
  dividendYielPercentageTTM: number;
  dividendYielTTM: number;
  payoutRatioTTM: number;
  priceToBookRatio: number;
  ebitPerRevenueTTM: number;
  effectiveTaxRateTTM: number;
  dividendPerShareTTM: number;
  freeCashFlowPerShareTTM: number;
  cashPerShareTTM: number;
  operatingCashFlowPerShareTTM: number;
  enterpriseValueMultipleTTM: number;
}

export interface KeyMetrics {
  revenuePerShareTTM: number;
  netIncomePerShareTTM: number;
  operatingCashFlowPerShareTTM: number;
  freeCashFlowPerShareTTM: number;
  cashPerShareTTM: number;
  bookValuePerShareTTM: number;
  tangibleBookValuePerShareTTM: number;
  shareholdersEquityPerShareTTM: number;
  interestDebtPerShareTTM: number;
  marketCapTTM: number;
  enterpriseValueTTM: number;
  peRatioTTM: number;
  priceToSalesRatioTTM: number;
  pocfratioTTM: number;
  pfcfRatioTTM: number;
  pbRatioTTM: number;
  ptbRatioTTM: number;
  evToSalesTTM: number;
  enterpriseValueOverEBITDATTM: number;
  evToOperatingCashFlowTTM: number;
  evToFreeCashFlowTTM: number;
  earningsYieldTTM: number;
  freeCashFlowYieldTTM: number;
  debtToEquityTTM: number;
  debtToAssetsTTM: number;
  netDebtToEBITDATTM: number;
  currentRatioTTM: number;
  dividendYieldTTM: number;
  dividendYieldPercentageTTM: number;
  payoutRatioTTM: number;
  roicTTM: number;
  capexPerShareTTM: number;
  capexToRevenueTTM: number;
  grahamNumberTTM: number;
}

export interface FinancialGrowth {
  revenueGrowth: number;
  grossProfitGrowth: number;
  ebitgrowth: number;
  operatingIncomeGrowth: number;
  netIncomeGrowth: number;
  epsgrowth: number;
  epsdilutedGrowth: number;
  freeCashFlowGrowth: number;
  operatingCashFlowGrowth: number;
  bookValueperShareGrowth: number;
  debtGrowth: number;
  tenYRevenueGrowthPerShare: number;
  fiveYRevenueGrowthPerShare: number;
  threeYRevenueGrowthPerShare: number;
  tenYOperatingCFGrowthPerShare: number;
  fiveYOperatingCFGrowthPerShare: number;
  threeYOperatingCFGrowthPerShare: number;
  tenYNetIncomeGrowthPerShare: number;
  fiveYNetIncomeGrowthPerShare: number;
  threeYNetIncomeGrowthPerShare: number;
  tenYShareholdersEquityGrowthPerShare: number;
  fiveYShareholdersEquityGrowthPerShare: number;
  threeYShareholdersEquityGrowthPerShare: number;
  tenYDividendperShareGrowthPerShare: number;
  fiveYDividendperShareGrowthPerShare: number;
  threeYDividendperShareGrowthPerShare: number;
  receivablesGrowth: number;
  inventoryGrowth: number;
  assetGrowth: number;
  rdexpenseGrowth: number;
  sgaexpensesGrowth: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  sharesOutstanding: number;
}

export interface IncomeStatement {
  revenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  ebitda: number;
  ebitdaratio: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
}

export interface BalanceSheet {
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
  cashAndCashEquivalents: number;
  shortTermDebt: number;
  longTermDebt: number;
  totalDebt: number;
  netDebt: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  inventory: number;
  netReceivables: number;
}

export interface CashFlowStatement {
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
  commonStockRepurchased: number;
  netCashUsedForInvestingActivites: number;
  debtRepayment: number;
}

export interface NewsArticle {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

export interface MetricScore {
  id: number;
  name: string;
  category: string;
  value: number | string | null;
  score: -1 | 0 | 1;
  signal: "buy" | "neutral" | "sell";
  formula: string;
  sectorNote: string;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  metrics: MetricScore[];
}

export interface ScoreBullet {
  text: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface PillarScore {
  name: string;
  score: number;
  maxScore: number;
  bullets: ScoreBullet[];
}

export interface AiRatingWhenUp {
  minDays: number;
  maxDays: number;
  earliestDate: string;
  latestDate: string;
  windowLabel: string;
}

export interface AiRatingWhenNotUp {
  expected: "not_likely_within_120_days";
  reevaluateAfterDays: number;
}

export interface AiRating {
  score: number;
  label:
    | "very_bullish"
    | "bullish"
    | "slightly_bullish"
    | "neutral_to_bearish"
    | "bearish";
  willGoUp: boolean;
  upProbability: number;
  horizonDays: number;
  when: AiRatingWhenUp | AiRatingWhenNotUp;
}

export interface MirofishGraphSignal {
  available: boolean;
  bullEvidence?: number;
  bearEvidence?: number;
  sentimentScore?: number;
  reason?: string;
}

export interface MirofishMeta {
  enabled: boolean;
  backendReachable: boolean;
  graphIdConfigured: boolean;
  note: string;
  simulatedSignal: "bullish" | "neutral" | "bearish";
  scoreAdjustment: number;
  graphSignal: MirofishGraphSignal;
}

/* ─── Multi-Agent Forecast System ─── */

export interface TrendAgentOutput {
  trend_direction: "bullish" | "bearish" | "neutral";
  trend_strength: number;      // 0–1
  explanation: string;
}

export interface FundamentalsAgentOutput {
  fundamental_score: number;   // 0–1
  valuation_label: "undervalued" | "fair" | "overvalued";
  explanation: string;
}

export interface SentimentAgentOutput {
  sentiment: "bullish" | "neutral" | "bearish";
  sentiment_score: number;     // 0–1
  explanation: string;
}

export interface RiskAgentOutput {
  risk_level: "low" | "medium" | "high";
  volatility_score: number;    // 0–1
  downside_risk_pct: number;   // e.g. 18.5 = 18.5%
  explanation: string;
}

export interface MacroAgentOutput {
  macro_bias: "bullish" | "neutral" | "bearish";
  macro_score: number;         // 0–1
  explanation: string;
}

export interface ForecastScenario {
  label: "Strong Bull" | "Moderate Bull" | "Neutral" | "Bearish" | "Extreme Bearish";
  priceTarget: number;
  returnPct: number;           // e.g. 25.4 = +25.4%
  probability: number;         // 0–100, all 5 scenarios sum to 100
  description: string;
}

export interface AgentForecastOutput {
  agents: {
    trend: TrendAgentOutput;
    fundamentals: FundamentalsAgentOutput;
    sentiment: SentimentAgentOutput;
    risk: RiskAgentOutput;
    macro: MacroAgentOutput;
  };
  composite_score: number;     // 0–1 weighted consensus
  composite_label: "very_bullish" | "bullish" | "neutral" | "bearish" | "very_bearish";
  bear_case: number;           // price
  base_case: number;           // price
  bull_case: number;           // price
  confidence: number;          // 0–100
  annual_volatility: number;   // e.g. 0.25 = 25%
  scenarios: ForecastScenario[];
  explanation: string;
}

export interface EvaluationResult {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  country: string;
  ipoDate: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  exchange: string;
  image: string;
  beta: number;
  volume: number;
  avgVolume: number;
  eps: number;
  pe: number;
  yearHigh: number;
  yearLow: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  qualityScore: number;
  growthScore: number;
  valueScore: number;
  combinedScore: number;
  // New 4-pillar scores
  fundamentalsScore: PillarScore;
  technicalScore: PillarScore;
  sentimentScore: PillarScore;
  riskScore: PillarScore;
  overallScore: number;
  // Risk analysis
  riskLevel: "Low" | "Moderate" | "High";
  bearCase: string[];
  // Timestamps
  dataUpdatedAt: string;
  rating: "STRONG BUY" | "BUY" | "HOLD" | "UNDERWEIGHT" | "SELL";
  ratingColor: string;
  categories: CategoryScore[];
  topSignals: MetricScore[];
  redFlags: MetricScore[];
  aiRating: AiRating;
  mirofish: MirofishMeta;
  agentForecast: AgentForecastOutput;
  evaluatedAt: string;
}
