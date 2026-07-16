// Mock dividend dashboard for Lovable preview (no VITE_API_BASE_URL).
// Deterministically partitions seed holdings across portfolios and computes
// a full dashboard shape matching the API response.

import type { DividendDashboard, DividendItem, DividendCalendarItem } from "@/lib/api/dividends";
import {
  holdings as seedHoldings,
  portfolios as seedPortfolios,
  monthLabels,
} from "@/lib/mock-data";

const TAX_RATE = 0.15;
const REFERENCE_DATE = new Date(2026, 6, 14); // Jul 14 2026

function holdingsFor(portfolioId: string) {
  return seedHoldings.filter(
    (_, i) => seedPortfolios[i % seedPortfolios.length].id === portfolioId,
  );
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function buildMockDividendDashboard(portfolioId: string): DividendDashboard {
  const held = holdingsFor(portfolioId);

  if (held.length === 0) {
    return {
      summary: {
        annualIncome: 0,
        monthlyIncome: 0,
        lifetimeIncome: 0,
        upcomingDividend: 0,
        yield: 0,
        yieldOnCost: 0,
      },
      upcoming: [],
      history: [],
      breakdownByStock: [],
      breakdownBySector: [],
      calendar: [],
      incomeTrend: monthLabels.map((m) => ({ month: m, income: 0 })),
    };
  }

  // --- Upcoming (next payout per holding, ~14-45 days out) ---
  const upcoming: DividendItem[] = held.map((h, i) => {
    const payDate = new Date(REFERENCE_DATE);
    payDate.setDate(payDate.getDate() + 14 + i * 6);
    const dps = +(h.annualDividend / 4).toFixed(2);
    const gross = Math.round(dps * h.qty);
    const tax = Math.round(gross * TAX_RATE);
    return {
      id: `up-${h.symbol}`,
      stock: h.symbol,
      company: h.name,
      eligibleShares: h.qty,
      dividendPerShare: dps,
      grossDividend: gross,
      taxAmount: tax,
      netDividend: gross - tax,
      paymentDate: toISO(payDate),
      status: i === 0 ? "PROCESSING" : "UPCOMING",
    };
  });

  // --- History (last 18 months of payouts) ---
  const history: DividendItem[] = [];
  held.forEach((h, hi) => {
    const payouts = 3 + (hi % 3);
    for (let i = 0; i < payouts; i++) {
      const monthsAgo = 2 + i * 4 + (hi % 2);
      const d = new Date(
        REFERENCE_DATE.getFullYear(),
        REFERENCE_DATE.getMonth() - monthsAgo,
        8 + (hi % 18),
      );
      const dps = +(h.annualDividend / payouts).toFixed(2);
      const gross = Math.round(dps * h.qty);
      const tax = Math.round(gross * TAX_RATE);
      history.push({
        id: `${h.symbol}-${d.getTime()}`,
        stock: h.symbol,
        company: h.name,
        eligibleShares: h.qty,
        dividendPerShare: dps,
        grossDividend: gross,
        taxAmount: tax,
        netDividend: gross - tax,
        paymentDate: toISO(d),
        status: "PAID",
      });
    }
  });
  history.sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));

  // --- Breakdown by stock ---
  const totalAnnual = held.reduce((s, h) => s + h.annualDividend * h.qty, 0);
  const breakdownByStock = held
    .map((h) => {
      const annualIncome = Math.round(h.annualDividend * h.qty);
      return {
        symbol: h.symbol,
        company: h.name,
        annualIncome,
        yield: h.dividendYield,
        yieldOnCost: h.yieldOnCost,
        contribution: totalAnnual > 0 ? +((annualIncome / totalAnnual) * 100).toFixed(1) : 0,
      };
    })
    .sort((a, b) => b.annualIncome - a.annualIncome);

  // --- Breakdown by sector ---
  const sectorMap = new Map<string, number>();
  held.forEach((h) => {
    sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.annualDividend * h.qty);
  });
  const breakdownBySector = [...sectorMap.entries()]
    .map(([sector, annualIncome]) => ({ sector, annualIncome: Math.round(annualIncome) }))
    .sort((a, b) => b.annualIncome - a.annualIncome);

  // --- Calendar ---
  const calendar: DividendCalendarItem[] = upcoming.map((u) => ({
    stock: u.stock,
    paymentDate: u.paymentDate,
    dividendPerShare: u.dividendPerShare,
  }));

  // --- Income trend (current calendar year, monthly) ---
  const trendByMonth = new Array(12).fill(0);
  history.forEach((r) => {
    const d = new Date(r.paymentDate);
    if (d.getFullYear() === REFERENCE_DATE.getFullYear()) {
      trendByMonth[d.getMonth()] += r.netDividend;
    }
  });
  upcoming.forEach((u) => {
    const d = new Date(u.paymentDate);
    if (d.getFullYear() === REFERENCE_DATE.getFullYear()) {
      trendByMonth[d.getMonth()] += u.netDividend;
    }
  });
  const incomeTrend = monthLabels.map((month, i) => ({
    month,
    income: Math.round(trendByMonth[i]),
  }));

  // --- Summary ---
  const annualIncome = Math.round(totalAnnual * (1 - TAX_RATE));
  const monthlyIncome = Math.round(annualIncome / 12);
  const lifetimeIncome = Math.round(annualIncome * 3.4);
  const upcomingDividend = upcoming.reduce((s, u) => s + u.netDividend, 0);
  const marketValue = held.reduce((s, h) => s + h.qty * h.currentPrice, 0) || 1;
  const cost = held.reduce((s, h) => s + h.qty * h.avgPrice, 0) || 1;
  const yieldPct = +((totalAnnual / marketValue) * 100).toFixed(2);
  const yieldOnCost = +((totalAnnual / cost) * 100).toFixed(2);

  return {
    summary: {
      annualIncome,
      monthlyIncome,
      lifetimeIncome,
      upcomingDividend,
      yield: yieldPct,
      yieldOnCost,
    },
    upcoming,
    history,
    breakdownByStock,
    breakdownBySector,
    calendar,
    incomeTrend,
  };
}
