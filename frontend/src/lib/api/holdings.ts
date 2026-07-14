// Holdings API service. Adjust endpoint paths to match your NestJS backend.
//   GET /holdings -> Holding[]
import { http } from "@/lib/http";
import type { Holding } from "@/lib/mock-data";
export type { Holding };
export const holdingsApi = {
  list: () => http.get<Holding[]>("/holding/byProfile"),
};