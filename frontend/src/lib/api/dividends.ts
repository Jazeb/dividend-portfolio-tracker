// Dividends API service. Adjust endpoint paths to match your NestJS backend.
//   GET /dividends/upcoming    -> UpcomingDividend[]
//   GET /dividends/monthly     -> MonthlyDividend[]
//   GET /dividends/growth      -> DividendGrowthPoint[]
//   GET /dividends/sectors     -> SectorAllocation[]

// Dividends API service.
//   GET /portfolios/:portfolioId/dividends/dashboard -> DividendDashboard
//
// Legacy endpoints (kept for compatibility):
//   GET /dividends/upcoming    -> UpcomingDividend[]
//   GET /dividends/monthly     -> MonthlyDividend[]
//   GET /dividends/growth      -> DividendGrowthPoint[]
//   GET /dividends/sectors     -> SectorAllocation[]

import { http } from "@/lib/http";

export interface UpcomingDividend {
  symbol: string;
  company: string;
  amount: string;
  exDate: string;
  payDate: string;
  total: number;
}

export interface MonthlyDividend {
  month: string;
  amount: number;
}

export interface DividendGrowthPoint {
  year: string;
  amount: number;
}

export interface SectorAllocation {
  name: string;
  value: number;
}

// ----- Portfolio-scoped dashboard --------------------------------

export type DividendItemStatus = "UPCOMING" | "PROCESSING" | "PAID";

export interface DividendSummary {
  annualIncome: number;
  monthlyIncome: number;
  lifetimeIncome: number;
  upcomingDividend: number;
  yield: number;
  yieldOnCost: number;
}

export interface DividendItem {
  id: string;
  stock: string;
  company: string;
  eligibleShares: number;
  dividendPerShare: number;
  grossDividend: number;
  taxAmount: number;
  netDividend: number;
  paymentDate: string;
  status: DividendItemStatus;
}

export interface DividendStockBreakdown {
  symbol: string;
  company: string;
  annualIncome: number;
  yield: number;
  yieldOnCost: number;
  contribution: number;
}

export interface DividendSectorBreakdown {
  sector: string;
  annualIncome: number;
}

export interface DividendCalendarItem {
  stock: string;
  paymentDate: string;
  dividendPerShare: number;
}

export interface DividendIncomeTrendPoint {
  month: string;
  income: number;
}

export interface DividendDashboard {
  summary: DividendSummary;
  upcoming: DividendItem[];
  history: DividendItem[];
  breakdownByStock: DividendStockBreakdown[];
  breakdownBySector: DividendSectorBreakdown[];
  calendar: DividendCalendarItem[];
  incomeTrend: DividendIncomeTrendPoint[];
}

export const dividendsApi = {
  upcoming: (portfolioId: string) =>
    http.get<UpcomingDividend[]>(`/dividends/upcoming?${portfolioId}`),
  monthly: () => http.get<MonthlyDividend[]>("/dividends/monthly"),
  growth: () => http.get<DividendGrowthPoint[]>("/dividends/growth"),
  sectors: () => http.get<SectorAllocation[]>("/dividends/sectors"),
  dashboard: (portfolioId: string) =>
    http.get<DividendDashboard>(`/dividends/dashboard?portfolioId=${portfolioId}`),
};

// import { http } from "@/lib/http";
// import {
//   UpcomingDividend,
//   MonthlyDividend,
//   DividendGrowthPoint,
//   SectorAllocation,
//   DividendHistory,
// } from "@/types";

// export const dividendsApi = {
//   upcoming: () => http.get<UpcomingDividend[]>("/dividends/upcoming"),
//   monthly: () => http.get<MonthlyDividend[]>("/dividends/monthly"),
//   growth: () => http.get<DividendGrowthPoint[]>("/dividends/growth"),
//   sectors: () => http.get<SectorAllocation[]>("/dividends/sectors"),
//   history: () => http.get<DividendHistory[]>("/dividends/history"),
// };
