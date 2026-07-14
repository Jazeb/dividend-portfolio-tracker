// Portfolios API service. Adjust endpoint paths to match your NestJS backend.
//   GET    /portfolios       -> Portfolio[]
//   POST   /portfolios       -> Portfolio
//   DELETE /portfolios/:id   -> void
import { http } from "@/lib/http";

export interface Sector {
  id: number;
  name: string;
}

export interface Stock {
  id: number;
  fullName: string;
  symbol: string;
  currentPrice: number;
  annualDividend: number;
  dividendYield: number;
  sector: Sector;
}

export interface Holding {
  id: number;
  quantity: number;
  avgPrice: number;
  totalCost: number;
  stocks: Stock;
}

export interface Portfolio {
  id: string;
  name: string;
  // value: number;
  // cost: number;
  // dividendIncome: number;
  // holdings: number;
  // yield: number;
  strategy?: string;
  description?: string;
  holdings?: Holding[];
}
export type CreatePortfolioDto = Omit<Portfolio, "id">;
export const portfoliosApi = {
  list: () => http.get<Portfolio[]>("/portfolio/byProfile"),
  create: (dto: CreatePortfolioDto) => http.post<Portfolio>("/portfolio", dto),
  remove: (id: string) => http.delete<void>(`/portfolio/${id}`),
};
