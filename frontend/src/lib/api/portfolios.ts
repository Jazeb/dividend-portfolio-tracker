// Portfolios API service. Adjust endpoint paths to match your NestJS backend.
//   GET    /portfolios       -> Portfolio[]
//   POST   /portfolios       -> Portfolio
//   DELETE /portfolios/:id   -> void
import { http } from "@/lib/http";
import { Portfolio } from "@/types";

export type CreatePortfolioDto = Omit<Portfolio, "id">;
export const portfoliosApi = {
  list: () => http.get<Portfolio[]>("/portfolio/byProfile"),
  create: (dto: CreatePortfolioDto) => http.post<Portfolio>("/portfolio", dto),
  remove: (id: string) => http.delete<void>(`/portfolio/${id}`),
};
