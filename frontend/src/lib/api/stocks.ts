// Stocks API service. Adjust the endpoint path to match your NestJS backend.
//   GET /stocks -> Stock[]
import { http } from "@/lib/http";
export interface Stock {
  symbol: string;
  name?: string;
  sector?: string;
}
export const stocksApi = {
  list: () => http.get<Stock[]>("/stocks"),
};
