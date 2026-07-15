// Dividends API service. Adjust endpoint paths to match your NestJS backend.
//   GET /dividends/upcoming    -> UpcomingDividend[]
//   GET /dividends/monthly     -> MonthlyDividend[]
//   GET /dividends/growth      -> DividendGrowthPoint[]
//   GET /dividends/sectors     -> SectorAllocation[]
import { http } from "@/lib/http";
import { UpcomingDividend, MonthlyDividend, DividendGrowthPoint, SectorAllocation } from "@/types"



export const dividendsApi = {
  upcoming: () => http.get<UpcomingDividend[]>("/dividends/upcoming"),
  monthly: () => http.get<MonthlyDividend[]>("/dividends/monthly"),
  growth: () => http.get<DividendGrowthPoint[]>("/dividends/growth"),
  sectors: () => http.get<SectorAllocation[]>("/dividends/sectors"),
};
