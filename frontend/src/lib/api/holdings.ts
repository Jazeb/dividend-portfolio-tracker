// Holdings API service. Adjust endpoint paths to match your NestJS backend.
//   GET /holdings -> Holding[]
import { http } from "@/lib/http";
import { Holding } from "@/types";

export const holdingsApi = {
  list: (portfolioId: string) =>
    http.get<Holding[]>(`/holding/dashboard?portfolioId=${portfolioId}`),
};
