import type {
  MetricScore,
  CategoryScore,
  EvaluationResult,
} from "./types";
import { getRatingFromScore } from "./utils";
import YahooFinance from "yahoo-finance2";

// yahoo-finance2 v3 requires instantiation
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
// Suppress noisy validation warnings in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(yahooFinance as any)._opts.validation.logErrors = false;

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

/* ─── Yahoo Finance Data Fetcher ─── */

interface YahooData {
  // Profile
  sector: string;
  industry: string;
  country: string;
  description: string;
  companyName: string;
  website: string;

  // Price
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  exchange: string;

  // Key Stats
  beta: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  enterpriseToRevenue: number | null;
  enterpriseToEbitda: number | null;
  enterpriseValue: number | null;
  trailingEps: number | null;
  bookValue: number | null;
  sharesOutstanding: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;

  // Financials
  grossMargins: number | null;
  operatingMargins: number | null;
  profitMargins: number | null;
  ebitdaMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  debtToEquity: number | null;
  totalDebt: number | null;
  totalCash: number | null;
  totalCashPerShare: number | null;
  freeCashflow: number | null;
  operatingCashflow: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  totalRevenue: number | null;
  revenuePerShare: number | null;
  grossProfits: number | null;

  // Dividends
  dividendYield: number | null;
  payoutRatio: number | null;
  trailingAnnualDividendYield: number | null;

  // Income Statement
  netIncome: number | null;
  ebitda: number | null;

  // Computed
  interestExpense: number | null;
  operatingIncome: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  stockholderEquity: number | null;
  goodwill: number | null;
  intangibleAssets: number | null;

  // Growth from historical
  revenueGrowth3yr: number | null;
  revenueGrowth5yr: number | null;
  fcfGrowth: number | null;
  netIncomeGrowth: number | null;
  epsGrowth: number | null;
  bookValueGrowth: number | null;
}

async function fetchYahooData(symbol: string): Promise<YahooData> {
  const modules = [
    "summaryProfile",
    "summaryDetail",
    "defaultKeyStatistics",
    "financialData",
    "price",
    "incomeStatementHistory",
    "balanceSheetHistory",
    "cashflowStatementHistory",
    "earnings",
  ] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any;
  try {
    result = await yahooFinance.quoteSummary(symbol, { modules: [...modules] });
  } catch (err: unknown) {
    console.error("Yahoo Finance quoteSummary failed:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Not Found") || msg.includes("404")) {
      throw new Error(`Ticker "${symbol}" not found. Check the symbol and try again.`);
    }
    throw new Error(
      `Unable to load data for "${symbol}" right now. Please try again in a moment.`
    );
  }

  const profile = result.summaryProfile || {};
  const detail = result.summaryDetail || {};
  const stats = result.defaultKeyStatistics || {};
  const fin = result.financialData || {};
  const priceData = result.price || {};
  const incomeHistory = result.incomeStatementHistory?.incomeStatementHistory || [];
  const balanceHistory = result.balanceSheetHistory?.balanceSheetHistory || [];
  const cashflowHistory = result.cashflowStatementHistory?.cashflowStatementHistory || [];

  // Compute growth rates from historical income statements
  let revenueGrowth3yr: number | null = null;
  let revenueGrowth5yr: number | null = null;
  let netIncomeGrowth: number | null = null;
  let epsGrowth: number | null = null;
  let fcfGrowth: number | null = null;
  let bookValueGrowth: number | null = null;

  if (incomeHistory.length >= 2) {
    const latest = incomeHistory[0];
    const prev = incomeHistory[1];
    if (prev?.totalRevenue && latest?.totalRevenue && prev.totalRevenue !== 0) {
      // YoY from most recent two
    }
    if (prev?.netIncome && latest?.netIncome && prev.netIncome !== 0) {
      netIncomeGrowth = (latest.netIncome - prev.netIncome) / Math.abs(prev.netIncome);
    }
    if (prev?.dilutedEPS && latest?.dilutedEPS && prev.dilutedEPS !== 0) {
      epsGrowth = (latest.dilutedEPS - prev.dilutedEPS) / Math.abs(prev.dilutedEPS);
    }
  }

  if (incomeHistory.length >= 4) {
    const latest = incomeHistory[0];
    const threeYr = incomeHistory[3] || incomeHistory[incomeHistory.length - 1];
    if (threeYr?.totalRevenue && latest?.totalRevenue && threeYr.totalRevenue > 0) {
      revenueGrowth3yr = Math.pow(latest.totalRevenue / threeYr.totalRevenue, 1 / 3) - 1;
    }
  }

  if (incomeHistory.length >= 5) {
    const latest = incomeHistory[0];
    const fiveYr = incomeHistory[4] || incomeHistory[incomeHistory.length - 1];
    if (fiveYr?.totalRevenue && latest?.totalRevenue && fiveYr.totalRevenue > 0) {
      revenueGrowth5yr = Math.pow(latest.totalRevenue / fiveYr.totalRevenue, 1 / 5) - 1;
    }
  }

  if (cashflowHistory.length >= 2) {
    const latestCF = cashflowHistory[0];
    const prevCF = cashflowHistory[1];
    const latestFCF = (latestCF?.totalCashFromOperatingActivities || 0) + (latestCF?.capitalExpenditures || 0);
    const prevFCF = (prevCF?.totalCashFromOperatingActivities || 0) + (prevCF?.capitalExpenditures || 0);
    if (prevFCF !== 0) {
      fcfGrowth = (latestFCF - prevFCF) / Math.abs(prevFCF);
    }
  }

  if (balanceHistory.length >= 2) {
    const latestBV = balanceHistory[0]?.totalStockholderEquity;
    const prevBV = balanceHistory[1]?.totalStockholderEquity;
    if (latestBV && prevBV && prevBV !== 0) {
      bookValueGrowth = (latestBV - prevBV) / Math.abs(prevBV);
    }
  }

  const latestBalance = balanceHistory[0] || {};
  const latestIncome = incomeHistory[0] || {};

  return {
    sector: profile.sector || "",
    industry: profile.industry || "",
    country: profile.country || "",
    description: profile.longBusinessSummary || "",
    companyName: priceData.longName || priceData.shortName || symbol,
    website: profile.website || "",

    price: priceData.regularMarketPrice || detail.previousClose || 0,
    change: priceData.regularMarketChange || 0,
    changePercent: (priceData.regularMarketChangePercent || 0) * 100,
    dayHigh: priceData.regularMarketDayHigh || detail.dayHigh || 0,
    dayLow: priceData.regularMarketDayLow || detail.dayLow || 0,
    open: priceData.regularMarketOpen || detail.open || 0,
    previousClose: detail.previousClose || priceData.regularMarketPreviousClose || 0,
    volume: priceData.regularMarketVolume || detail.volume || 0,
    avgVolume: detail.averageVolume || detail.averageDailyVolume10Day || 0,
    marketCap: priceData.marketCap || detail.marketCap || 0,
    exchange: priceData.exchangeName || priceData.exchange || "",

    beta: safe(detail.beta) ?? safe(stats.beta),
    trailingPE: safe(detail.trailingPE),
    forwardPE: safe(stats.forwardPE) ?? safe(detail.forwardPE),
    pegRatio: safe(stats.pegRatio),
    priceToBook: safe(stats.priceToBook),
    enterpriseToRevenue: safe(stats.enterpriseToRevenue),
    enterpriseToEbitda: safe(stats.enterpriseToEbitda),
    enterpriseValue: safe(stats.enterpriseValue),
    trailingEps: safe(stats.trailingEps) ?? safe(fin.earningsPerShare),
    bookValue: safe(stats.bookValue),
    sharesOutstanding: safe(stats.sharesOutstanding) ?? safe(priceData.sharesOutstanding),
    fiftyTwoWeekHigh: detail.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: detail.fiftyTwoWeekLow || 0,
    fiftyDayAverage: safe(detail.fiftyDayAverage),
    twoHundredDayAverage: safe(detail.twoHundredDayAverage),

    grossMargins: safe(fin.grossMargins),
    operatingMargins: safe(fin.operatingMargins),
    profitMargins: safe(fin.profitMargins),
    ebitdaMargins: safe(fin.ebitdaMargins),
    returnOnEquity: safe(fin.returnOnEquity),
    returnOnAssets: safe(fin.returnOnAssets),
    currentRatio: safe(fin.currentRatio),
    quickRatio: safe(fin.quickRatio),
    debtToEquity: safe(fin.debtToEquity),
    totalDebt: safe(fin.totalDebt),
    totalCash: safe(fin.totalCash),
    totalCashPerShare: safe(fin.totalCashPerShare),
    freeCashflow: safe(fin.freeCashflow),
    operatingCashflow: safe(fin.operatingCashflow),
    revenueGrowth: safe(fin.revenueGrowth),
    earningsGrowth: safe(fin.earningsGrowth),
    totalRevenue: safe(fin.totalRevenue),
    revenuePerShare: safe(fin.revenuePerShare),
    grossProfits: safe(fin.grossProfits),

    dividendYield: safe(detail.dividendYield) ?? safe(detail.trailingAnnualDividendYield),
    payoutRatio: safe(detail.payoutRatio),
    trailingAnnualDividendYield: safe(detail.trailingAnnualDividendYield),

    netIncome: safe(latestIncome.netIncome),
    ebitda: safe(latestIncome.ebitda),
    interestExpense: safe(latestIncome.interestExpense),
    operatingIncome: safe(latestIncome.operatingIncome),
    totalAssets: safe(latestBalance.totalAssets),
    totalLiabilities: safe(latestBalance.totalLiab),
    stockholderEquity: safe(latestBalance.totalStockholderEquity),
    goodwill: safe(latestBalance.goodWill),
    intangibleAssets: safe(latestBalance.intangibleAssets),

    revenueGrowth3yr: safe(revenueGrowth3yr),
    revenueGrowth5yr: safe(revenueGrowth5yr),
    fcfGrowth: safe(fcfGrowth),
    netIncomeGrowth: safe(netIncomeGrowth),
    epsGrowth: safe(epsGrowth),
    bookValueGrowth: safe(bookValueGrowth),
  };
}

/* ─── Evaluation Functions ─── */

function evaluateValuation(d: YahooData): MetricScore[] {
  const sector = d.sector;
  const isTech = /tech|software|semiconductor/i.test(sector);
  const isFinancial = /bank|financial|insurance/i.test(sector);
  const isUtility = /utilit/i.test(sector);
  const isEnergy = /energy|oil|gas/i.test(sector);

  const peMax = isTech ? 35 : isUtility ? 18 : isFinancial ? 15 : 20;
  const peSellMin = isTech ? 50 : 30;

  const psFCF = d.marketCap && d.freeCashflow && d.freeCashflow > 0 ? d.marketCap / d.freeCashflow : null;
  const psCF = d.marketCap && d.operatingCashflow && d.operatingCashflow > 0 ? d.marketCap / d.operatingCashflow : null;
  const psRatio = d.marketCap && d.totalRevenue && d.totalRevenue > 0 ? d.marketCap / d.totalRevenue : null;
  const evFCF = d.enterpriseValue && d.freeCashflow && d.freeCashflow > 0 ? d.enterpriseValue / d.freeCashflow : null;
  const earningsYield = d.trailingPE && d.trailingPE > 0 ? 1 / d.trailingPE : null;
  const fcfYield = d.marketCap && d.freeCashflow ? d.freeCashflow / d.marketCap : null;

  const grahamNumber = d.trailingEps && d.bookValue && d.trailingEps > 0 && d.bookValue > 0
    ? Math.sqrt(22.5 * d.trailingEps * d.bookValue) : null;
  const priceVsGraham = grahamNumber && d.price > 0 ? d.price / grahamNumber : null;

  return [
    scoreMetric(1, "P/E Ratio", "Valuation", safe(d.trailingPE),
      (v) => v > 0 && v <= peMax,
      (v) => v > peSellMin || v < 0,
      "Price / EPS", `Buy: <${peMax}; Sell: >${peSellMin} or negative`),
    scoreMetric(4, "PEG Ratio", "Valuation", safe(d.pegRatio),
      (v) => v > 0 && v < (isTech ? 2.0 : 1.0),
      (v) => v > 2.0 || v < 0,
      "P/E / EPS Growth %", "Buy: <1.0; SaaS: <2.0 ok"),
    scoreMetric(6, "P/B Ratio", "Valuation", safe(d.priceToBook),
      (v) => v > 0 && v < (isFinancial ? 1.2 : isTech ? 8 : 1.5),
      (v) => v > (isTech ? 15 : 3.0),
      "Price / Book Value", isFinancial ? "Banks: <1.2 ideal" : "Tech: 3-8 normal"),
    scoreMetric(7, "P/S Ratio", "Valuation", safe(psRatio),
      (v) => v < (isTech ? 10 : 2.0),
      (v) => v > (isTech ? 20 : 5.0),
      "Price / Revenue per Share", isTech ? "SaaS: <10 ok if growing >30%" : "General: <2"),
    scoreMetric(8, "P/FCF Ratio", "Valuation", safe(psFCF),
      (v) => v > 0 && v < 15,
      (v) => v > 25 || v < 0,
      "Price / FCF per Share", "Best for mature cos; <15 = undervalued"),
    scoreMetric(9, "P/CF Ratio", "Valuation", safe(psCF),
      (v) => v > 0 && v < 10,
      (v) => v > 20 || v < 0,
      "Price / Op CF per Share", "Capital-intensive: use this vs P/E"),
    scoreMetric(10, "EV/EBITDA", "Valuation", safe(d.enterpriseToEbitda),
      (v) => v > 0 && v < (isTech ? 20 : isEnergy ? 6 : 8),
      (v) => v > (isTech ? 30 : 14),
      "EV / EBITDA", isTech ? "Tech: <20 ok" : isEnergy ? "Energy: <6" : "General: <8"),
    scoreMetric(12, "EV/Revenue", "Valuation", safe(d.enterpriseToRevenue),
      (v) => v > 0 && v < (isTech ? 10 : 2.0),
      (v) => v > (isTech ? 20 : 5.0),
      "EV / Revenue", isTech ? "SaaS: <10 if high-growth" : "General: <2"),
    scoreMetric(13, "EV/FCF", "Valuation", safe(evFCF),
      (v) => v > 0 && v < 15,
      (v) => v > 25 || v < 0,
      "EV / Free Cash Flow", "Cleanest valuation; <15 = undervalued"),
    scoreMetric(45, "Earnings Yield", "Valuation", safe(earningsYield),
      (v) => v > 0.05,
      (v) => v < 0.02,
      "EPS / Price", "Buy: >5%; compare to 10yr Treasury",
      earningsYield != null ? (earningsYield * 100).toFixed(2) + "%" : undefined),
    scoreMetric(46, "FCF Yield", "Valuation", safe(fcfYield),
      (v) => v > 0.05,
      (v) => v < 0.02,
      "FCF/Share / Price", "Buy: >5%; cleanest yield metric",
      fcfYield != null ? (fcfYield * 100).toFixed(2) + "%" : undefined),
    scoreMetric(23, "Graham Number", "Valuation", safe(priceVsGraham),
      (v) => v < 1.0,
      (v) => v > 1.1,
      "Price vs sqrt(22.5 x EPS x BVPS)", "Price below Graham # = value",
      grahamNumber != null ? "$" + grahamNumber.toFixed(2) : undefined),
  ];
}

function evaluateProfitability(d: YahooData): MetricScore[] {
  const sector = d.sector;
  const isTech = /tech|software|semiconductor/i.test(sector);
  const isRetail = /retail|consumer/i.test(sector);
  const isFinancial = /bank|financial/i.test(sector);

  // Compute ROIC: NOPAT / Invested Capital
  const nopat = d.operatingIncome && d.operatingIncome > 0 ? d.operatingIncome * 0.79 : null; // ~21% tax
  const investedCapital = d.stockholderEquity && d.totalDebt
    ? d.stockholderEquity + d.totalDebt - (d.totalCash || 0) : null;
  const roic = nopat && investedCapital && investedCapital > 0 ? nopat / investedCapital : null;

  // ROCE: EBIT / Capital Employed
  const capitalEmployed = d.totalAssets && d.totalLiabilities
    ? d.totalAssets - (d.totalLiabilities - (d.totalDebt || 0)) : null;
  const roce = d.operatingIncome && capitalEmployed && capitalEmployed > 0
    ? d.operatingIncome / capitalEmployed : null;

  return [
    scoreMetric(31, "Gross Margin", "Profitability", safe(d.grossMargins),
      (v) => v > (isTech ? 0.70 : isRetail ? 0.30 : 0.50),
      (v) => v < 0.20,
      "Gross Profit / Revenue", isTech ? "SaaS: >70%" : "Retail: >30%",
      d.grossMargins != null ? (d.grossMargins * 100).toFixed(1) + "%" : undefined),
    scoreMetric(32, "Operating Margin", "Profitability", safe(d.operatingMargins),
      (v) => v > (isTech ? 0.20 : isRetail ? 0.05 : 0.15),
      (v) => v < 0.05,
      "Op Income / Revenue", isTech ? "Tech: >20%" : "Retail: >5%",
      d.operatingMargins != null ? (d.operatingMargins * 100).toFixed(1) + "%" : undefined),
    scoreMetric(33, "Net Profit Margin", "Profitability", safe(d.profitMargins),
      (v) => v > (isTech ? 0.15 : 0.10),
      (v) => v < 0.03,
      "Net Income / Revenue", isTech ? "Software: >15%" : "General: >10%",
      d.profitMargins != null ? (d.profitMargins * 100).toFixed(1) + "%" : undefined),
    scoreMetric(34, "EBITDA Margin", "Profitability", safe(d.ebitdaMargins),
      (v) => v > 0.20,
      (v) => v < 0.08,
      "EBITDA / Revenue", "SaaS: >20%; Telecom: >30%",
      d.ebitdaMargins != null ? (d.ebitdaMargins * 100).toFixed(1) + "%" : undefined),
    scoreMetric(38, "Return on Equity", "Profitability", safe(d.returnOnEquity),
      (v) => v > (isFinancial ? 0.12 : 0.15),
      (v) => v < 0.08,
      "Net Income / Equity", isFinancial ? "Banks: >12%" : "General: >15%",
      d.returnOnEquity != null ? (d.returnOnEquity * 100).toFixed(1) + "%" : undefined),
    scoreMetric(39, "Return on Assets", "Profitability", safe(d.returnOnAssets),
      (v) => v > (isFinancial ? 0.01 : 0.05),
      (v) => v < 0.01,
      "Net Income / Avg Assets", isFinancial ? "Banks: >1%" : "General: >5%",
      d.returnOnAssets != null ? (d.returnOnAssets * 100).toFixed(1) + "%" : undefined),
    scoreMetric(40, "ROIC", "Profitability", safe(roic),
      (v) => v > 0.12,
      (v) => v < 0.06,
      "NOPAT / Invested Capital", "ROIC > WACC = value creation; holy grail",
      roic != null ? (roic * 100).toFixed(1) + "%" : undefined),
    scoreMetric(41, "ROCE", "Profitability", safe(roce),
      (v) => v > 0.15,
      (v) => v < 0.08,
      "EBIT / Capital Employed", "Equivalent to ROIC for most purposes",
      roce != null ? (roce * 100).toFixed(1) + "%" : undefined),
  ];
}

function evaluateLiquiditySolvency(d: YahooData): MetricScore[] {
  const sector = d.sector;
  const isFinancial = /bank|financial/i.test(sector);

  // Debt/Assets
  const debtToAssets = d.totalDebt && d.totalAssets && d.totalAssets > 0
    ? d.totalDebt / d.totalAssets : null;

  // Net Debt / EBITDA
  const netDebt = d.totalDebt != null && d.totalCash != null ? d.totalDebt - d.totalCash : null;
  const netDebtToEbitda = netDebt != null && d.ebitda && d.ebitda > 0 ? netDebt / d.ebitda : null;

  // Interest Coverage
  const interestCoverage = d.operatingIncome && d.interestExpense && Math.abs(d.interestExpense) > 0
    ? d.operatingIncome / Math.abs(d.interestExpense) : null;

  // Cash Ratio
  const cashRatio = d.totalCash && d.totalAssets && d.totalLiabilities
    ? d.totalCash / (d.totalAssets - d.stockholderEquity! || 1) : null;

  // D/E from Yahoo comes as percentage (e.g., 150 = 1.5x)
  const debtToEquity = d.debtToEquity != null ? d.debtToEquity / 100 : null;

  return [
    scoreMetric(56, "Current Ratio", "Liquidity & Solvency", safe(d.currentRatio),
      (v) => v >= 1.5 && v <= 3.0,
      (v) => v < 1.0,
      "Current Assets / Current Liabilities", "Buy: 1.5-3.0; Sell: <1.0"),
    scoreMetric(57, "Quick Ratio", "Liquidity & Solvency", safe(d.quickRatio),
      (v) => v > 1.0,
      (v) => v < 0.5,
      "(Cash+Recv) / Current Liabilities", "Buy: >1.0; Sell: <0.5"),
    scoreMetric(58, "Cash Ratio", "Liquidity & Solvency", safe(cashRatio),
      (v) => v > 0.5,
      (v) => v < 0.2,
      "Cash / Current Liabilities", "Buy: >0.5; most conservative"),
    scoreMetric(59, "Debt/Equity", "Liquidity & Solvency", safe(debtToEquity),
      (v) => v >= 0 && v < (isFinancial ? 8 : 0.5),
      (v) => v > (isFinancial ? 15 : 2.0),
      "Total Debt / Equity", isFinancial ? "Banks: higher is normal" : "Tech: near 0 preferred"),
    scoreMetric(61, "Debt/Assets", "Liquidity & Solvency", safe(debtToAssets),
      (v) => v < 0.4,
      (v) => v > 0.6,
      "Total Debt / Total Assets", "Buy: <0.4; Sell: >0.6"),
    scoreMetric(63, "Net Debt/EBITDA", "Liquidity & Solvency", safe(netDebtToEbitda),
      (v) => v < 1.5,
      (v) => v > 4.0,
      "Net Debt / EBITDA", "Buy: <1.5x; Danger zone: >4x"),
    scoreMetric(64, "Interest Coverage", "Liquidity & Solvency", safe(interestCoverage),
      (v) => v > 5,
      (v) => v < 2,
      "EBIT / Interest Expense", "Buy: >5x; Sell: <2x (can't cover debt)"),
    scoreMetric(227, "Cash per Share", "Liquidity & Solvency", safe(d.totalCashPerShare),
      (v) => v > 0,
      (v) => v <= 0,
      "Cash & Equiv / Shares", "Higher = floor support",
      d.totalCashPerShare != null ? "$" + d.totalCashPerShare.toFixed(2) : undefined),
  ];
}

function evaluateGrowth(d: YahooData): MetricScore[] {
  const sector = d.sector;
  const isTech = /tech|software|semiconductor/i.test(sector);

  return [
    scoreMetric(81, "Revenue Growth YoY", "Growth", safe(d.revenueGrowth),
      (v) => v > (isTech ? 0.20 : 0.15),
      (v) => v < 0,
      "(Rev_t - Rev_{t-1}) / Rev_{t-1}", isTech ? "Tech: >20%" : "General: >15%",
      d.revenueGrowth != null ? (d.revenueGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(85, "EPS Growth YoY", "Growth", safe(d.epsGrowth),
      (v) => v > 0.20,
      (v) => v < 0.05,
      "(EPS_t - EPS_{t-1}) / EPS_{t-1}", "Buy: >20%; look for consistency",
      d.epsGrowth != null ? (d.epsGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(83, "Revenue 3yr CAGR", "Growth", safe(d.revenueGrowth3yr),
      (v) => v > 0.12,
      (v) => v < 0.03,
      "3yr compound annual rev growth", "Smooths one-off years",
      d.revenueGrowth3yr != null ? (d.revenueGrowth3yr * 100).toFixed(1) + "%" : undefined),
    scoreMetric(84, "Revenue 5yr CAGR", "Growth", safe(d.revenueGrowth5yr),
      (v) => v > 0.10,
      (v) => v < 0.02,
      "5yr compound annual rev growth", "Long-term structural growth indicator",
      d.revenueGrowth5yr != null ? (d.revenueGrowth5yr * 100).toFixed(1) + "%" : undefined),
    scoreMetric(89, "Earnings Growth QoQ", "Growth", safe(d.earningsGrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "Quarterly earnings growth", "Rising earnings = fundamental strength",
      d.earningsGrowth != null ? (d.earningsGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(91, "Net Income Growth", "Growth", safe(d.netIncomeGrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "YoY net income change", "Verify quality: FCF should track NI",
      d.netIncomeGrowth != null ? (d.netIncomeGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(92, "FCF Growth YoY", "Growth", safe(d.fcfGrowth),
      (v) => v > 0.15,
      (v) => v < 0,
      "YoY free cash flow change", "Most important growth metric",
      d.fcfGrowth != null ? (d.fcfGrowth * 100).toFixed(1) + "%" : undefined),
    scoreMetric(94, "Book Value Growth", "Growth", safe(d.bookValueGrowth),
      (v) => v > 0.10,
      (v) => v < 0,
      "YoY BVPS change", "Buffett metric; tracks intrinsic value",
      d.bookValueGrowth != null ? (d.bookValueGrowth * 100).toFixed(1) + "%" : undefined),
  ];
}

function evaluateCashFlow(d: YahooData): MetricScore[] {
  const fcfConversion = d.netIncome && d.freeCashflow
    ? d.freeCashflow / Math.abs(d.netIncome) : null;

  const capexToRev = d.operatingCashflow && d.freeCashflow && d.totalRevenue && d.totalRevenue > 0
    ? (d.operatingCashflow - d.freeCashflow) / d.totalRevenue : null;

  const accruals = d.netIncome != null && d.operatingCashflow != null
    ? (d.netIncome - d.operatingCashflow) / Math.abs(d.netIncome || 1) : null;

  const fcfPerShare = d.freeCashflow && d.sharesOutstanding && d.sharesOutstanding > 0
    ? d.freeCashflow / d.sharesOutstanding : null;

  return [
    scoreMetric(119, "Operating Cash Flow", "Cash Flow",
      d.operatingCashflow != null ? (d.operatingCashflow > 0 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "Cash from operations", "Must be positive consistently",
      d.operatingCashflow != null ? "$" + (d.operatingCashflow / 1e6).toFixed(0) + "M" : undefined),
    scoreMetric(120, "Free Cash Flow", "Cash Flow",
      d.freeCashflow != null ? (d.freeCashflow > 0 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "OCF - CapEx", "FCF is the lifeblood of a company",
      d.freeCashflow != null ? "$" + (d.freeCashflow / 1e6).toFixed(0) + "M" : undefined),
    scoreMetric(123, "FCF per Share", "Cash Flow", safe(fcfPerShare),
      (v) => v > 0,
      (v) => v < 0,
      "FCF / Diluted Shares", "Growing = wealth creation",
      fcfPerShare != null ? "$" + fcfPerShare.toFixed(2) : undefined),
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
    scoreMetric(134, "Accruals Ratio", "Cash Flow", safe(accruals),
      (v) => v < 0.03,
      (v) => v > 0.08,
      "(NI - OCF) / Net Assets", "High accruals = aggressive accounting"),
  ];
}

function evaluateDividends(d: YahooData): MetricScore[] {
  const sector = d.sector;
  const isREIT = /reit|real estate/i.test(sector);
  const isUtility = /utilit/i.test(sector);

  const hasDividend = d.dividendYield != null && d.dividendYield > 0;

  if (!hasDividend) {
    return [
      scoreMetric(135, "Dividend Yield", "Dividends", 0,
        () => false, () => false,
        "Annual Div / Price", "No dividend paid", "0%"),
    ];
  }

  return [
    scoreMetric(135, "Dividend Yield", "Dividends", safe(d.dividendYield),
      (v) => v >= 0.02 && v <= 0.05,
      (v) => v > 0.08,
      "Annual Div / Price", isREIT ? "REITs: 4-6%" : isUtility ? "Utilities: 3-5%" : "General: 2-5%",
      d.dividendYield != null ? (d.dividendYield * 100).toFixed(2) + "%" : undefined),
    scoreMetric(137, "Payout Ratio", "Dividends", safe(d.payoutRatio),
      (v) => v > 0 && v < (isREIT ? 0.90 : isUtility ? 0.70 : 0.60),
      (v) => v > 0.80 || v < 0,
      "Dividends / Net Income", isREIT ? "REITs: up to 90% ok" : "General: 30-60%",
      d.payoutRatio != null ? (d.payoutRatio * 100).toFixed(1) + "%" : undefined),
  ];
}

function evaluateMomentum(d: YahooData): MetricScore[] {
  const yearRange = d.fiftyTwoWeekHigh - d.fiftyTwoWeekLow;
  const rangePosition = yearRange > 0 ? (d.price - d.fiftyTwoWeekLow) / yearRange : null;
  const vs52High = d.fiftyTwoWeekHigh > 0 ? (d.price - d.fiftyTwoWeekHigh) / d.fiftyTwoWeekHigh : null;
  const aboveSma50 = d.fiftyDayAverage != null ? d.price > d.fiftyDayAverage : null;
  const aboveSma200 = d.twoHundredDayAverage != null ? d.price > d.twoHundredDayAverage : null;
  const volumeRatio = d.avgVolume > 0 ? d.volume / d.avgVolume : null;

  return [
    scoreMetric(155, "Price vs 50D SMA", "Momentum",
      aboveSma50 != null ? (aboveSma50 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "Price vs 50-day moving average", "Above = bullish medium-term trend",
      d.fiftyDayAverage != null
        ? (aboveSma50 ? "Above" : "Below") + " ($" + d.fiftyDayAverage.toFixed(2) + ")"
        : undefined),
    scoreMetric(156, "Price vs 200D SMA", "Momentum",
      aboveSma200 != null ? (aboveSma200 ? 1 : -1) : null,
      (v) => v > 0,
      (v) => v < 0,
      "Price vs 200-day moving average", "Defines long-term bull/bear trend",
      d.twoHundredDayAverage != null
        ? (aboveSma200 ? "Above" : "Below") + " ($" + d.twoHundredDayAverage.toFixed(2) + ")"
        : undefined),
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
    scoreMetric(161, "Volume Ratio", "Momentum", safe(volumeRatio),
      (v) => v > 1.2,
      (v) => v < 0.5,
      "Today's Volume / Avg Volume", ">1.2 = unusual interest",
      volumeRatio != null ? volumeRatio.toFixed(2) + "x" : undefined),
    scoreMetric(169, "Avg Daily Volume", "Momentum", safe(d.avgVolume),
      (v) => v > 500_000,
      (v) => v < 100_000,
      "Shares traded per day", ">500K = liquid; <100K = illiquid",
      d.avgVolume > 0 ? (d.avgVolume / 1e6).toFixed(2) + "M" : undefined),
  ];
}

function evaluateBalanceSheet(d: YahooData): MetricScore[] {
  const netDebt = d.totalDebt != null && d.totalCash != null
    ? d.totalDebt - d.totalCash : null;

  const goodwillPct = d.totalAssets && (d.goodwill || d.intangibleAssets)
    ? ((d.goodwill || 0) + (d.intangibleAssets || 0)) / d.totalAssets : null;

  return [
    scoreMetric(226, "Net Debt Position", "Balance Sheet", netDebt,
      (v) => v < 0,
      (v) => v > 0 && d.totalAssets != null && d.totalAssets > 0 && v / d.totalAssets > 0.3,
      "Total Debt - Cash", "Negative = net cash = fortress",
      netDebt != null
        ? (netDebt < 0 ? "Net Cash $" : "Net Debt $") + Math.abs(netDebt / 1e6).toFixed(0) + "M"
        : undefined),
    scoreMetric(225, "Goodwill % of Assets", "Balance Sheet", safe(goodwillPct),
      (v) => v < 0.20,
      (v) => v > 0.40,
      "Goodwill / Total Assets", ">40% = serial acquirer risk",
      goodwillPct != null ? (goodwillPct * 100).toFixed(1) + "%" : undefined),
    scoreMetric(230, "Shares Outstanding", "Balance Sheet",
      d.sharesOutstanding != null ? d.sharesOutstanding : null,
      () => true,
      () => false,
      "Total diluted shares", "Declining = buybacks (positive)",
      d.sharesOutstanding != null ? (d.sharesOutstanding / 1e6).toFixed(0) + "M" : undefined),
  ];
}

function evaluateRiskVolatility(d: YahooData): MetricScore[] {
  return [
    scoreMetric(201, "Beta (1-Year)", "Risk & Volatility", safe(d.beta),
      (v) => v >= 0.5 && v <= 1.2,
      (v) => v > 2.0 || v < 0,
      "Cov(stock,mkt) / Var(mkt)", "0.5-1.2 = moderate; >2.0 = very volatile"),
    scoreMetric(281, "Market Cap", "Risk & Volatility", safe(d.marketCap),
      (v) => v > 2e9,
      (v) => v < 300e6,
      "Price x Shares Outstanding", "Large/Mid cap preferred for stability",
      d.marketCap > 0 ? "$" + (d.marketCap / 1e9).toFixed(2) + "B" : undefined),
  ];
}

/* ─── Main Evaluator ─── */

export async function evaluateStock(ticker: string, _apiKey?: string): Promise<EvaluationResult> {
  const symbol = ticker.toUpperCase().trim();

  const d = await fetchYahooData(symbol);

  if (!d.companyName || d.companyName === symbol) {
    // Possibly invalid ticker
  }

  const allMetrics: MetricScore[] = [
    ...evaluateValuation(d),
    ...evaluateProfitability(d),
    ...evaluateLiquiditySolvency(d),
    ...evaluateGrowth(d),
    ...evaluateCashFlow(d),
    ...evaluateDividends(d),
    ...evaluateMomentum(d),
    ...evaluateBalanceSheet(d),
    ...evaluateRiskVolatility(d),
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

  // Get company logo from website domain
  let image = "";
  if (d.website) {
    try {
      const domain = new URL(d.website).hostname.replace("www.", "");
      image = `https://logo.clearbit.com/${domain}`;
    } catch {
      // ignore
    }
  }

  return {
    ticker: symbol,
    companyName: d.companyName,
    sector: d.sector,
    industry: d.industry,
    description: d.description,
    country: d.country,
    ipoDate: "",
    price: d.price,
    change: d.change,
    changePercent: d.changePercent,
    marketCap: d.marketCap,
    exchange: d.exchange,
    image,
    beta: d.beta ?? 0,
    volume: d.volume,
    avgVolume: d.avgVolume,
    eps: d.trailingEps ?? 0,
    pe: d.trailingPE ?? 0,
    yearHigh: d.fiftyTwoWeekHigh,
    yearLow: d.fiftyTwoWeekLow,
    dayHigh: d.dayHigh,
    dayLow: d.dayLow,
    open: d.open,
    previousClose: d.previousClose,
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
