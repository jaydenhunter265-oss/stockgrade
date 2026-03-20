import type {
  MetricScore,
  CategoryScore,
  EvaluationResult,
  CompanyProfile,
  FinancialRatios,
  KeyMetrics,
  FinancialGrowth,
  StockQuote,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
} from "./types";
import { getRatingFromScore } from "./utils";

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

async function fmpFetch<T>(endpoint: string, apiKey: string): Promise<T | null> {
  try {
    const res = await fetch(`${FMP_BASE}${endpoint}${endpoint.includes("?") ? "&" : "?"}apikey=${apiKey}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function safe(val: unknown): number | null {
  if (val == null || typeof val !== "number" || isNaN(val) || !isFinite(val)) return null;
  return val;
}

function scoreMetric(
  id: number,
  name: string,
  category: string,
  value: number | null,
  buyTest: (v: number) => boolean,
  sellTest: (v: number) => boolean,
  formula: string,
  sectorNote: string,
  displayValue?: string
): MetricScore {
  if (value == null) {
    return { id, name, category, value: "N/A", score: 0, signal: "neutral", formula, sectorNote };
  }
  const isBuy = buyTest(value);
  const isSell = sellTest(value);
  const score = isBuy ? 1 : isSell ? -1 : 0;
  const signal = isBuy ? "buy" : isSell ? "sell" : "neutral";
  return {
    id, name, category,
    value: displayValue ?? (Math.abs(value) < 1000 ? Number(value.toFixed(2)) : Math.round(value)),
    score, signal, formula, sectorNote,
  };
}

function evaluateValuation(
  ratios: FinancialRatios | null,
  metrics: KeyMetrics | null,
  quote: StockQuote | null,
  sector: string
): MetricScore[] {
  const r = ratios;
  const m = metrics;
  const isTech = /tech|software|semiconductor/i.test(sector);
  const isFinancial = /bank|financial|insurance/i.test(sector);
  const isUtility = /utilit/i.test(sector);
  const isEnergy = /energy|oil|gas/i.test(sector);
  const isREIT = /reit|real estate/i.test(sector);

  const peMax = isTech ? 35 : isUtility ? 18 : isFinancial ? 15 : 20;
  const peSellMin = isTech ? 50 : 30;

  return [
    scoreMetric(1, "P/E Ratio", "Valuation", safe(r?.peRatioTTM),
      (v) => v > 0 && v <= peMax,
      (v) => v > peSellMin || v < 0,
      "Price / EPS", `Buy: <${peMax}; Sell: >${peSellMin} or negative`),
    scoreMetric(4, "PEG Ratio", "Valuation", safe(r?.pegRatioTTM),
      (v) => v > 0 && v < (isTech ? 2.0 : 1.0),
      (v) => v > 2.0 || v < 0,
      "P/E / EPS Growth %", "Buy: <1.0; SaaS: <2.0 ok"),
    scoreMetric(6, "P/B Ratio", "Valuation", safe(r?.priceToBookRatioTTM),
      (v) => v > 0 && v < (isFinancial ? 1.2 : isTech ? 8 : 1.5),
      (v) => v > (isTech ? 15 : 3.0),
      "Price / Book Value", isFinancial ? "Banks: <1.2 ideal" : "Tech: 3-8 normal"),
    scoreMetric(7, "P/S Ratio", "Valuation", safe(r?.priceToSalesRatioTTM),
      (v) => v < (isTech ? 10 : 2.0),
      (v) => v > (isTech ? 20 : 5.0),
      "Price / Revenue per Share", isTech ? "SaaS: <10 ok if growing >30%" : "General: <2"),
    scoreMetric(8, "P/FCF Ratio", "Valuation", safe(r?.priceToFreeCashFlowsRatioTTM),
      (v) => v > 0 && v < 15,
      (v) => v > 25 || v < 0,
      "Price / FCF per Share", "Best for mature cos; <15 = undervalued"),
    scoreMetric(9, "P/CF Ratio", "Valuation", safe(r?.priceCashFlowRatioTTM),
      (v) => v > 0 && v < 10,
      (v) => v > 20 || v < 0,
      "Price / Op CF per Share", "Capital-intensive: use this vs P/E"),
    scoreMetric(10, "EV/EBITDA", "Valuation", safe(r?.enterpriseValueOverEBITDATTM ?? m?.enterpriseValueOverEBITDATTM),
      (v) => v > 0 && v < (isTech ? 20 : isEnergy ? 6 : 8),
      (v) => v > (isTech ? 30 : 14),
      "EV / EBITDA", isTech ? "Tech: <20 ok" : isEnergy ? "Energy: <6" : "General: <8"),
    scoreMetric(12, "EV/Revenue", "Valuation", safe(m?.evToSalesTTM),
      (v) => v > 0 && v < (isTech ? 10 : 2.0),
      (v) => v > (isTech ? 20 : 5.0),
      "EV / Revenue", isTech ? "SaaS: <10 if high-growth" : "General: <2"),
    scoreMetric(13, "EV/FCF", "Valuation", safe(m?.evToFreeCashFlowTTM),
      (v) => v > 0 && v < 15,
      (v) => v > 25 || v < 0,
      "EV / Free Cash Flow", "Cleanest valuation; <15 = undervalued"),
    scoreMetric(45, "Earnings Yield", "Valuation", safe(m?.earningsYieldTTM),
      (v) => v > 0.05,
      (v) => v < 0.02,
      "EPS / Price", "Buy: >5%; compare to 10yr Treasury",
      m?.earningsYieldTTM != null ? (m.earningsYieldTTM * 100).toFixed(2) + "%" : undefined),
    scoreMetric(46, "FCF Yield", "Valuation", safe(m?.freeCashFlowYieldTTM),
      (v) => v > 0.05,
      (v) => v < 0.02,
      "FCF/Share / Price", "Buy: >5%; cleanest yield metric",
      m?.freeCashFlowYieldTTM != null ? (m.freeCashFlowYieldTTM * 100).toFixed(2) + "%" : undefined),
    scoreMetric(23, "Graham Number", "Valuation",
      m?.grahamNumberTTM != null && quote?.price != null ? quote.price / m.grahamNumberTTM : null,
      (v) => v < 1.0,
      (v) => v > 1.1,
      "Price vs sqrt(22.5 x EPS x BVPS)", "Price below Graham # = value",
      m?.grahamNumberTTM != null ? "$" + m.grahamNumberTTM.toFixed(2) : undefined),
  ];
}

function evaluateProfitability(
  ratios: FinancialRatios | null,
  metrics: KeyMetrics | null,
  sector: string
): MetricScore[] {
  const r = ratios;
  const m = metrics;
  const isTech = /tech|software|semiconductor/i.test(sector);
  const isRetail = /retail|consumer/i.test(sector);
  const isFinancial = /bank|financial/i.test(sector);

  return [
    scoreMetric(31, "Gross Margin", "Profitability", safe(r?.grossProfitMarginTTM),
      (v) => v > (isTech ? 0.70 : isRetail ? 0.30 : 0.50),
      (v) => v < 0.20,
      "Gross Profit / Revenue", isTech ? "SaaS: >70%" : "Retail: >30%",
      r?.grossProfitMarginTTM != null ? (r.grossProfitMarginTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(32, "Operating Margin", "Profitability", safe(r?.operatingProfitMarginTTM),
      (v) => v > (isTech ? 0.20 : isRetail ? 0.05 : 0.15),
      (v) => v < 0.05,
      "Op Income / Revenue", isTech ? "Tech: >20%" : "Retail: >5%",
      r?.operatingProfitMarginTTM != null ? (r.operatingProfitMarginTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(33, "Net Profit Margin", "Profitability", safe(r?.netProfitMarginTTM),
      (v) => v > (isTech ? 0.15 : 0.10),
      (v) => v < 0.03,
      "Net Income / Revenue", isTech ? "Software: >15%" : "General: >10%",
      r?.netProfitMarginTTM != null ? (r.netProfitMarginTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(34, "EBITDA Margin", "Profitability", safe(r?.ebitPerRevenueTTM),
      (v) => v > 0.20,
      (v) => v < 0.08,
      "EBITDA / Revenue", "SaaS: >20%; Telecom: >30%",
      r?.ebitPerRevenueTTM != null ? (r.ebitPerRevenueTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(38, "Return on Equity", "Profitability", safe(r?.returnOnEquityTTM),
      (v) => v > (isFinancial ? 0.12 : 0.15),
      (v) => v < 0.08,
      "Net Income / Equity", isFinancial ? "Banks: >12%" : "General: >15%",
      r?.returnOnEquityTTM != null ? (r.returnOnEquityTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(39, "Return on Assets", "Profitability", safe(r?.returnOnAssetsTTM),
      (v) => v > (isFinancial ? 0.01 : 0.05),
      (v) => v < 0.01,
      "Net Income / Avg Assets", isFinancial ? "Banks: >1%" : "General: >5%",
      r?.returnOnAssetsTTM != null ? (r.returnOnAssetsTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(40, "ROIC", "Profitability", safe(m?.roicTTM),
      (v) => v > 0.12,
      (v) => v < 0.06,
      "NOPAT / Invested Capital", "ROIC > WACC = value creation; holy grail",
      m?.roicTTM != null ? (m.roicTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(41, "ROCE", "Profitability", safe(r?.returnOnCapitalEmployedTTM),
      (v) => v > 0.15,
      (v) => v < 0.08,
      "EBIT / Capital Employed", "Equivalent to ROIC for most purposes",
      r?.returnOnCapitalEmployedTTM != null ? (r.returnOnCapitalEmployedTTM * 100).toFixed(1) + "%" : undefined),
  ];
}

function evaluateLiquiditySolvency(
  ratios: FinancialRatios | null,
  metrics: KeyMetrics | null,
  balance: BalanceSheet | null,
  sector: string
): MetricScore[] {
  const r = ratios;
  const m = metrics;
  const isFinancial = /bank|financial/i.test(sector);

  return [
    scoreMetric(56, "Current Ratio", "Liquidity & Solvency", safe(r?.currentRatioTTM ?? m?.currentRatioTTM),
      (v) => v >= 1.5 && v <= 3.0,
      (v) => v < 1.0,
      "Current Assets / Current Liabilities", "Buy: 1.5-3.0; Sell: <1.0"),
    scoreMetric(57, "Quick Ratio", "Liquidity & Solvency", safe(r?.quickRatioTTM),
      (v) => v > 1.0,
      (v) => v < 0.5,
      "(Cash+Recv) / Current Liabilities", "Buy: >1.0; Sell: <0.5"),
    scoreMetric(58, "Cash Ratio", "Liquidity & Solvency", safe(r?.cashRatioTTM),
      (v) => v > 0.5,
      (v) => v < 0.2,
      "Cash / Current Liabilities", "Buy: >0.5; most conservative"),
    scoreMetric(59, "Debt/Equity", "Liquidity & Solvency", safe(r?.debtEquityRatioTTM ?? m?.debtToEquityTTM),
      (v) => v >= 0 && v < (isFinancial ? 8 : 0.5),
      (v) => v > (isFinancial ? 15 : 2.0),
      "Total Debt / Equity", isFinancial ? "Banks: higher is normal" : "Tech: near 0 preferred"),
    scoreMetric(61, "Debt/Assets", "Liquidity & Solvency", safe(r?.debtRatioTTM ?? m?.debtToAssetsTTM),
      (v) => v < 0.4,
      (v) => v > 0.6,
      "Total Debt / Total Assets", "Buy: <0.4; Sell: >0.6"),
    scoreMetric(63, "Net Debt/EBITDA", "Liquidity & Solvency", safe(m?.netDebtToEBITDATTM),
      (v) => v < 1.5,
      (v) => v > 4.0,
      "Net Debt / EBITDA", "Buy: <1.5x; Danger zone: >4x"),
    scoreMetric(64, "Interest Coverage", "Liquidity & Solvency", safe(r?.interestCoverageTTM),
      (v) => v > 5,
      (v) => v < 2,
      "EBIT / Interest Expense", "Buy: >5x; Sell: <2x (can't cover debt)"),
    scoreMetric(227, "Cash per Share", "Liquidity & Solvency", safe(r?.cashPerShareTTM ?? m?.cashPerShareTTM),
      (v) => v > 0,
      (v) => v <= 0,
      "Cash & Equiv / Shares", "Higher = floor support",
      r?.cashPerShareTTM != null ? "$" + r.cashPerShareTTM.toFixed(2) : undefined),
  ];
}

function evaluateGrowth(
  growth: FinancialGrowth | null,
  income: IncomeStatement[] | null,
  sector: string
): MetricScore[] {
  const g = growth;
  const isTech = /tech|software|semiconductor/i.test(sector);

  return [
    scoreMetric(81, "Revenue Growth YoY", "Growth", safe(g?.revenueGrowth),
      (v) => v > (isTech ? 0.20 : 0.15),
      (v) => v < 0,
      "(Rev_t - Rev_{t-1}) / Rev_{t-1}", isTech ? "Tech: >20%" : "General: >15%",
      g?.revenueGrowth != null ? (g.revenueGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(85, "EPS Growth YoY", "Growth", safe(g?.epsdilutedGrowth),
      (v) => v > 0.20,
      (v) => v < 0.05,
      "(EPS_t - EPS_{t-1}) / EPS_{t-1}", "Buy: >20%; look for consistency",
      g?.epsdilutedGrowth != null ? (g.epsdilutedGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(83, "Revenue 3yr CAGR", "Growth", safe(g?.threeYRevenueGrowthPerShare),
      (v) => v > 0.12,
      (v) => v < 0.03,
      "3yr compound annual rev growth", "Smooths one-off years",
      g?.threeYRevenueGrowthPerShare != null ? (g.threeYRevenueGrowthPerShare * 100).toFixed(1) + "%" : undefined),
    scoreMetric(84, "Revenue 5yr CAGR", "Growth", safe(g?.fiveYRevenueGrowthPerShare),
      (v) => v > 0.10,
      (v) => v < 0.02,
      "5yr compound annual rev growth", "Long-term structural growth indicator",
      g?.fiveYRevenueGrowthPerShare != null ? (g.fiveYRevenueGrowthPerShare * 100).toFixed(1) + "%" : undefined),
    scoreMetric(89, "EBITDA Growth YoY", "Growth", safe(g?.ebitgrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "YoY EBITDA change", "Rising EBITDA + stable margins = organic",
      g?.ebitgrowth != null ? (g.ebitgrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(90, "Op Income Growth", "Growth", safe(g?.operatingIncomeGrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "YoY operating income change", "Faster than rev = operating leverage",
      g?.operatingIncomeGrowth != null ? (g.operatingIncomeGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(91, "Net Income Growth", "Growth", safe(g?.netIncomeGrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "YoY net income change", "Verify quality: FCF should track NI",
      g?.netIncomeGrowth != null ? (g.netIncomeGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(92, "FCF Growth YoY", "Growth", safe(g?.freeCashFlowGrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "YoY free cash flow change", "Most important growth metric",
      g?.freeCashFlowGrowth != null ? (g.freeCashFlowGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(94, "Book Value Growth", "Growth", safe(g?.bookValueperShareGrowth),
      (v) => v > 0.10,
      (v) => v < 0,
      "YoY BVPS change", "Buffett metric; tracks intrinsic value",
      g?.bookValueperShareGrowth != null ? (g.bookValueperShareGrowth * 100).toFixed(1) + "%" : undefined),
  ];
}

function evaluateCashFlow(
  cashFlow: CashFlowStatement | null,
  income: IncomeStatement | null,
  metrics: KeyMetrics | null,
  ratios: FinancialRatios | null
): MetricScore[] {
  const cf = cashFlow;
  const inc = income;
  const m = metrics;

  const fcfConversion = inc?.netIncome && cf?.freeCashFlow
    ? cf.freeCashFlow / inc.netIncome : null;
  const capexToRev = m?.capexToRevenueTTM;

  return [
    scoreMetric(119, "Operating Cash Flow", "Cash Flow",
      cf?.operatingCashFlow != null ? (cf.operatingCashFlow > 0 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "Cash from operations", "Must be positive consistently",
      cf?.operatingCashFlow != null ? "$" + (cf.operatingCashFlow / 1e6).toFixed(0) + "M" : undefined),
    scoreMetric(120, "Free Cash Flow", "Cash Flow",
      cf?.freeCashFlow != null ? (cf.freeCashFlow > 0 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "OCF - CapEx", "FCF is the lifeblood of a company",
      cf?.freeCashFlow != null ? "$" + (cf.freeCashFlow / 1e6).toFixed(0) + "M" : undefined),
    scoreMetric(123, "FCF per Share", "Cash Flow", safe(m?.freeCashFlowPerShareTTM),
      (v) => v > 0,
      (v) => v < 0,
      "FCF / Diluted Shares", "Growing = wealth creation",
      m?.freeCashFlowPerShareTTM != null ? "$" + m.freeCashFlowPerShareTTM.toFixed(2) : undefined),
    scoreMetric(124, "CapEx / Revenue", "Cash Flow", safe(capexToRev),
      (v) => Math.abs(v) < 0.10,
      (v) => Math.abs(v) > 0.25,
      "Capital Expenditures / Revenue", "Capital-light = scalable; >25% = heavy",
      capexToRev != null ? (Math.abs(capexToRev) * 100).toFixed(1) + "%" : undefined),
    scoreMetric(132, "FCF Conversion", "Cash Flow", safe(fcfConversion),
      (v) => v > 0.90,
      (v) => v < 0.60 || v < 0,
      "FCF / Net Income", "Buy: >90%; <60% = accrual quality issue",
      fcfConversion != null ? (fcfConversion * 100).toFixed(1) + "%" : undefined),
    scoreMetric(134, "Accruals Ratio", "Cash Flow",
      inc?.netIncome != null && cf?.operatingCashFlow != null
        ? (inc.netIncome - cf.operatingCashFlow) / Math.abs(inc.netIncome || 1)
        : null,
      (v) => v < 0.03,
      (v) => v > 0.08,
      "(NI - OCF) / Net Assets", "High accruals = aggressive accounting"),
  ];
}

function evaluateDividends(
  ratios: FinancialRatios | null,
  metrics: KeyMetrics | null,
  growth: FinancialGrowth | null,
  quote: StockQuote | null,
  sector: string
): MetricScore[] {
  const r = ratios;
  const m = metrics;
  const g = growth;
  const isREIT = /reit|real estate/i.test(sector);
  const isUtility = /utilit/i.test(sector);

  const divYield = safe(r?.dividendYielPercentageTTM ?? m?.dividendYieldPercentageTTM);
  const hasDividend = divYield != null && divYield > 0;

  if (!hasDividend) {
    return [
      scoreMetric(135, "Dividend Yield", "Dividends", 0,
        () => false, () => false,
        "Annual Div / Price", "No dividend paid", "0%"),
    ];
  }

  return [
    scoreMetric(135, "Dividend Yield", "Dividends", safe(divYield != null ? divYield / 100 : null),
      (v) => v >= 0.02 && v <= 0.05,
      (v) => v > 0.08,
      "Annual Div / Price", isREIT ? "REITs: 4-6%" : isUtility ? "Utilities: 3-5%" : "General: 2-5%",
      divYield != null ? divYield.toFixed(2) + "%" : undefined),
    scoreMetric(137, "Payout Ratio", "Dividends", safe(r?.payoutRatioTTM ?? m?.payoutRatioTTM),
      (v) => v > 0 && v < (isREIT ? 0.90 : isUtility ? 0.70 : 0.60),
      (v) => v > 0.80 || v < 0,
      "Dividends / Net Income", isREIT ? "REITs: up to 90% ok" : "General: 30-60%",
      r?.payoutRatioTTM != null ? (r.payoutRatioTTM * 100).toFixed(1) + "%" : undefined),
    scoreMetric(97, "Dividend 5yr CAGR", "Dividends", safe(g?.fiveYDividendperShareGrowthPerShare),
      (v) => v > 0.06,
      (v) => v < 0.02,
      "5yr dividend compound growth", "Aristocrats: 25+ yrs; Kings: 50+ yrs",
      g?.fiveYDividendperShareGrowthPerShare != null
        ? (g.fiveYDividendperShareGrowthPerShare * 100).toFixed(1) + "%" : undefined),
  ];
}

function evaluateMomentum(quote: StockQuote | null): MetricScore[] {
  const q = quote;
  if (!q) return [];

  const yearRange = q.yearHigh - q.yearLow;
  const rangePosition = yearRange > 0 ? (q.price - q.yearLow) / yearRange : null;
  const vs52High = q.yearHigh > 0 ? (q.price - q.yearHigh) / q.yearHigh : null;
  const aboveSma50 = q.priceAvg50 > 0 ? q.price > q.priceAvg50 : null;
  const aboveSma200 = q.priceAvg200 > 0 ? q.price > q.priceAvg200 : null;
  const volumeRatio = q.avgVolume > 0 ? q.volume / q.avgVolume : null;

  return [
    scoreMetric(155, "Price vs 50D SMA", "Momentum",
      aboveSma50 != null ? (aboveSma50 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "Price vs 50-day moving average", "Above = bullish medium-term trend",
      aboveSma50 != null ? (aboveSma50 ? "Above" : "Below") + " ($" + q.priceAvg50.toFixed(2) + ")" : undefined),
    scoreMetric(156, "Price vs 200D SMA", "Momentum",
      aboveSma200 != null ? (aboveSma200 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "Price vs 200-day moving average", "Defines long-term bull/bear trend",
      aboveSma200 != null ? (aboveSma200 ? "Above" : "Below") + " ($" + q.priceAvg200.toFixed(2) + ")" : undefined),
    scoreMetric(158, "vs 52-Week High", "Momentum", safe(vs52High),
      (v) => v > -0.10,
      (v) => v < -0.30,
      "(Price / 52wk High) - 1", "Within 10% = strength, not weakness",
      vs52High != null ? (vs52High * 100).toFixed(1) + "%" : undefined),
    scoreMetric(160, "52-Week Range Position", "Momentum", safe(rangePosition),
      (v) => v > 0.75,
      (v) => v < 0.25,
      "(P - Low) / (High - Low)", "Upper quartile = momentum",
      rangePosition != null ? (rangePosition * 100).toFixed(0) + "th percentile" : undefined),
    scoreMetric(169, "Avg Daily Volume", "Momentum", safe(q.avgVolume),
      (v) => v > 500_000,
      (v) => v < 100_000,
      "Shares traded per day", ">500K = liquid; <100K = illiquid",
      q.avgVolume != null ? (q.avgVolume / 1e6).toFixed(2) + "M" : undefined),
  ];
}

function evaluateBalanceSheet(
  balance: BalanceSheet | null,
  metrics: KeyMetrics | null,
  quote: StockQuote | null
): MetricScore[] {
  const b = balance;
  const m = metrics;
  const q = quote;

  const goodwillPct = b?.totalAssets && b?.goodwillAndIntangibleAssets
    ? b.goodwillAndIntangibleAssets / b.totalAssets : null;
  const netDebt = b?.totalDebt != null && b?.cashAndCashEquivalents != null
    ? b.totalDebt - b.cashAndCashEquivalents : null;

  return [
    scoreMetric(226, "Net Debt Position", "Balance Sheet",
      netDebt,
      (v) => v < 0,
      (v) => v > 0 && b != null && b.totalAssets > 0 && v / b.totalAssets > 0.3,
      "Total Debt - Cash", "Negative = net cash = fortress",
      netDebt != null ? (netDebt < 0 ? "Net Cash $" : "Net Debt $") + Math.abs(netDebt / 1e6).toFixed(0) + "M" : undefined),
    scoreMetric(225, "Goodwill % of Assets", "Balance Sheet", safe(goodwillPct),
      (v) => v < 0.20,
      (v) => v > 0.40,
      "Goodwill / Total Assets", ">40% = serial acquirer risk",
      goodwillPct != null ? (goodwillPct * 100).toFixed(1) + "%" : undefined),
    scoreMetric(230, "Shares Outstanding", "Balance Sheet",
      q?.sharesOutstanding != null ? q.sharesOutstanding : null,
      () => true,
      () => false,
      "Total diluted shares", "Declining = buybacks (positive)",
      q?.sharesOutstanding != null ? (q.sharesOutstanding / 1e6).toFixed(0) + "M" : undefined),
    scoreMetric(201, "Beta", "Balance Sheet", safe(q?.pe != null ? undefined : undefined),
      () => false, () => false,
      "Covariance with market", "0.5-1.2 = moderate risk"),
  ];
}

function evaluateRiskVolatility(profile: CompanyProfile | null, quote: StockQuote | null): MetricScore[] {
  return [
    scoreMetric(201, "Beta (1-Year)", "Risk & Volatility", safe(profile?.beta),
      (v) => v >= 0.5 && v <= 1.2,
      (v) => v > 2.0 || v < 0,
      "Cov(stock,mkt) / Var(mkt)", "0.5-1.2 = moderate; >2.0 = very volatile"),
    scoreMetric(281, "Market Cap", "Risk & Volatility", safe(quote?.marketCap),
      (v) => v > 2e9,
      (v) => v < 300e6,
      "Price x Shares Outstanding", "Large/Mid cap preferred for stability",
      quote?.marketCap != null ? "$" + (quote.marketCap / 1e9).toFixed(2) + "B" : undefined),
  ];
}

export async function evaluateStock(ticker: string, apiKey: string): Promise<EvaluationResult> {
  const symbol = ticker.toUpperCase().trim();

  const [
    profileArr,
    ratiosArr,
    metricsArr,
    growthArr,
    quoteArr,
    incomeArr,
    balanceArr,
    cashFlowArr,
  ] = await Promise.all([
    fmpFetch<CompanyProfile[]>(`/profile/${symbol}`, apiKey),
    fmpFetch<FinancialRatios[]>(`/ratios-ttm/${symbol}`, apiKey),
    fmpFetch<KeyMetrics[]>(`/key-metrics-ttm/${symbol}`, apiKey),
    fmpFetch<FinancialGrowth[]>(`/financial-growth/${symbol}?limit=1`, apiKey),
    fmpFetch<StockQuote[]>(`/quote/${symbol}`, apiKey),
    fmpFetch<IncomeStatement[]>(`/income-statement/${symbol}?limit=5`, apiKey),
    fmpFetch<BalanceSheet[]>(`/balance-sheet-statement/${symbol}?limit=2`, apiKey),
    fmpFetch<CashFlowStatement[]>(`/cash-flow-statement/${symbol}?limit=2`, apiKey),
  ]);

  const profile = profileArr?.[0] ?? null;
  const ratios = ratiosArr?.[0] ?? null;
  const keyMetrics = metricsArr?.[0] ?? null;
  const growth = growthArr?.[0] ?? null;
  const quote = quoteArr?.[0] ?? null;
  const latestIncome = incomeArr?.[0] ?? null;
  const latestBalance = balanceArr?.[0] ?? null;
  const latestCashFlow = cashFlowArr?.[0] ?? null;

  if (!profile && !quote) {
    throw new Error(`Ticker "${symbol}" not found. Please check the symbol and try again.`);
  }

  const sector = profile?.sector ?? "";

  const allMetrics: MetricScore[] = [
    ...evaluateValuation(ratios, keyMetrics, quote, sector),
    ...evaluateProfitability(ratios, keyMetrics, sector),
    ...evaluateLiquiditySolvency(ratios, keyMetrics, latestBalance, sector),
    ...evaluateGrowth(growth, incomeArr, sector),
    ...evaluateCashFlow(latestCashFlow, latestIncome, keyMetrics, ratios),
    ...evaluateDividends(ratios, keyMetrics, growth, quote, sector),
    ...evaluateMomentum(quote),
    ...evaluateRiskVolatility(profile, quote),
  ];

  const categoryMap: Record<string, MetricScore[]> = {};
  for (const m of allMetrics) {
    if (!categoryMap[m.category]) categoryMap[m.category] = [];
    categoryMap[m.category].push(m);
  }

  const categories: CategoryScore[] = Object.entries(categoryMap).map(([name, metrics]) => {
    const scored = metrics.filter((m) => m.value !== "N/A");
    const sum = scored.reduce((acc, m) => acc + m.score, 0);
    const maxScore = scored.length;
    const normalized = maxScore > 0 ? ((sum + maxScore) / (2 * maxScore)) * 100 : 50;
    return {
      name,
      score: sum,
      maxScore,
      percentage: Math.round(Math.max(0, Math.min(100, normalized))),
      metrics,
    };
  });

  const totalScored = allMetrics.filter((m) => m.value !== "N/A");
  const totalSum = totalScored.reduce((acc, m) => acc + m.score, 0);
  const totalMax = totalScored.length;
  const quantScore = totalMax > 0 ? Math.round(((totalSum + totalMax) / (2 * totalMax)) * 100) : 50;

  const finalScore = quantScore;
  const { rating, color } = getRatingFromScore(finalScore);

  const topSignals = allMetrics
    .filter((m) => m.score === 1 && m.value !== "N/A")
    .slice(0, 5);
  const redFlags = allMetrics
    .filter((m) => m.score === -1 && m.value !== "N/A")
    .slice(0, 5);

  return {
    ticker: symbol,
    companyName: profile?.companyName ?? quote?.name ?? symbol,
    sector: profile?.sector ?? "",
    industry: profile?.industry ?? "",
    price: quote?.price ?? profile?.price ?? 0,
    change: quote?.change ?? profile?.changes ?? 0,
    changePercent: quote?.changesPercentage ?? profile?.changesPercentage ?? 0,
    marketCap: quote?.marketCap ?? profile?.mktCap ?? 0,
    exchange: profile?.exchange ?? quote?.exchange ?? "",
    image: profile?.image ?? "",
    quantScore,
    qualScore: 0,
    finalScore,
    rating,
    ratingColor: color,
    categories,
    topSignals,
    redFlags,
    evaluatedAt: new Date().toISOString(),
  };
}
