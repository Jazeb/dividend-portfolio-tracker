// Dividends API service. Adjust endpoint paths to match your NestJS backend.
//   GET /dividends/upcoming    -> UpcomingDividend[]
//   GET /dividends/monthly     -> MonthlyDividend[]
//   GET /dividends/growth      -> DividendGrowthPoint[]
//   GET /dividends/sectors     -> SectorAllocation[]
import { http } from "@/lib/http";
export interface UpcomingDividend {
  symbol: string;
  company: string;
  amount: string; // e.g. "PKR 3.5/sh"
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
export const dividendsApi = {
  upcoming: () => http.get<UpcomingDividend[]>("/dividends/upcoming"),
  monthly: () => http.get<MonthlyDividend[]>("/dividends/monthly"),
  growth: () => http.get<DividendGrowthPoint[]>("/dividends/growth"),
  sectors: () => http.get<SectorAllocation[]>("/dividends/sectors"),
};
