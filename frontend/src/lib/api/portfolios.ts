// Portfolios API service. Adjust endpoint paths to match your NestJS backend.
//   GET    /portfolios       -> Portfolio[]
//   POST   /portfolios       -> Portfolio
//   DELETE /portfolios/:id   -> void
import { http } from "@/lib/http";
import { Portfolio, PortfolioDashboard } from "@/types";

export interface PortfolioPerformance {
  dividend: {
    annualIncome: number;
    yieldOnCost: number;
    currentYield: number;
    growth: number;
  };
  capital: {
    marketValue: number;
    unrealizedGain: number;
    realizedGain: number;
    totalReturn: number;
  };
  portfolioGrowth: { month: string; cost: number; marketValue: number }[];
  annualDividendGrowth: { year: number; income: number; projected?: boolean }[];
  monthlyDividendIncome: { month: string; income: number }[];
  incomeByStock: { symbol: string; income: number; percentage: number }[];
  insights: {
    highestContributor: string;
    highestYieldOnCost: string;
    largestCapitalGain: string;
    largestPosition: string;
  };
  health: {
    dividendTarget: number;
    currentDividend: number;
    diversificationScore: string;
    holdingPeriodYears: number;
  };
}

export type CreatePortfolioDto = Omit<
  Portfolio,
  | "id"
  | "portfolioCost"
  | "holdingsCount"
  | "portfolioNetworth"
  | "portfolioProfit"
  | "profitPercent"
  | "annualDividendIncome"
  | "yield"
  | "createdAt"
>;
export const portfoliosApi = {
  dashboardData: () => http.get<PortfolioDashboard[]>("/portfolio/dashboard"),
  getByProfile: () => http.get<Portfolio[]>("/portfolio/byProfile"),
  list: () => http.get<Portfolio[]>("/portfolio/byProfile"),
  byId: (id: string) => http.get<Portfolio>(`/portfolio/${id}`),
  create: (dto: CreatePortfolioDto) => http.post<Portfolio>("/portfolio", dto),
  remove: (id: string) => http.delete<void>(`/portfolio/${id}`),
  performance: (id: number | string) =>
    http.get<PortfolioPerformance>(`/portfolio/${id}/performance`),
};
