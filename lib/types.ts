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
  evaluatedAt: string;
}
