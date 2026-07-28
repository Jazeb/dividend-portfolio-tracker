import type { PortfolioPerformance } from "@/lib/api/portfolios";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function buildMockPerformance(input: {
  marketValue: number;
  costBasis: number;
  annualDividend: number;
  holdings: {
    symbol: string;
    qty: number;
    avgPrice: number;
    currentPrice: number;
    annualDividend: number;
  }[];
}): PortfolioPerformance {
  const { marketValue, costBasis, annualDividend, holdings } = input;
  const unrealizedGain = marketValue - costBasis;
  const realizedGain = Math.round(unrealizedGain * 0.14);
  const totalReturn = unrealizedGain + realizedGain + Math.round(annualDividend * 0.6);
  const yieldOnCost = costBasis > 0 ? (annualDividend / costBasis) * 100 : 0;
  const currentYield = marketValue > 0 ? (annualDividend / marketValue) * 100 : 0;

  const portfolioGrowth = MONTHS.map((m, i) => {
    const t = i / 11;
    const cost = Math.round(costBasis * (0.82 + 0.18 * t));
    const mv = Math.round(marketValue * (0.78 + 0.22 * t) * (1 + Math.sin(i) * 0.015));
    return { month: m, cost, marketValue: mv };
  });

  const currentYear = new Date().getFullYear();
  const annualDividendGrowth = [3, 2, 1, 0].map((back, idx) => {
    const year = currentYear - back;
    const factor = [0.52, 0.7, 0.85, 1][idx];
    return {
      year,
      income: Math.round(annualDividend * factor),
      ...(back === 0 ? { projected: true } : {}),
    };
  });

  // Payments concentrated in typical PSX quarters (Mar, Jun, Sep, Dec)
  const monthWeights = [0.02, 0.03, 0.18, 0.05, 0.04, 0.22, 0.05, 0.04, 0.18, 0.04, 0.03, 0.12];
  const monthlyDividendIncome = MONTHS.map((m, i) => ({
    month: m,
    income: Math.round(annualDividend * monthWeights[i]),
  }));

  const totalAnnual = holdings.reduce((s, h) => s + h.qty * h.annualDividend, 0) || 1;
  const incomeByStock = holdings
    .map((h) => {
      const inc = Math.round(h.qty * h.annualDividend);
      return {
        symbol: h.symbol,
        income: inc,
        percentage: (inc / totalAnnual) * 100,
      };
    })
    .sort((a, b) => b.income - a.income);

  const yocByHolding = holdings
    .map((h) => ({
      symbol: h.symbol,
      yoc: h.avgPrice > 0 ? (h.annualDividend / h.avgPrice) * 100 : 0,
    }))
    .sort((a, b) => b.yoc - a.yoc);
  const capGainByHolding = holdings
    .map((h) => ({ symbol: h.symbol, gain: (h.currentPrice - h.avgPrice) * h.qty }))
    .sort((a, b) => b.gain - a.gain);
  const positionByHolding = holdings
    .map((h) => ({ symbol: h.symbol, mv: h.qty * h.currentPrice }))
    .sort((a, b) => b.mv - a.mv);

  return {
    dividend: {
      annualIncome: Math.round(annualDividend),
      yieldOnCost: Number(yieldOnCost.toFixed(2)),
      currentYield: Number(currentYield.toFixed(2)),
      growth: 18.2,
    },
    capital: {
      marketValue: Math.round(marketValue),
      unrealizedGain: Math.round(unrealizedGain),
      realizedGain,
      totalReturn,
    },
    portfolioGrowth,
    annualDividendGrowth,
    monthlyDividendIncome,
    incomeByStock,
    insights: {
      highestContributor: incomeByStock[0]?.symbol ?? "—",
      highestYieldOnCost: yocByHolding[0]?.symbol ?? "—",
      largestCapitalGain: capGainByHolding[0]?.symbol ?? "—",
      largestPosition: positionByHolding[0]?.symbol ?? "—",
    },
    health: {
      dividendTarget: Math.round(annualDividend * 1.35),
      currentDividend: Math.round(annualDividend),
      diversificationScore: new Set(holdings.map((h) => h.symbol)).size >= 6 ? "Excellent" : "Good",
      holdingPeriodYears: 2.6,
    },
  };
}
