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
import {
  DividendDashboard,
  DividendGrowthPoint,
  MonthlyDividend,
  SectorAllocation,
  UpcomingDividend,
} from "@/types";

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
