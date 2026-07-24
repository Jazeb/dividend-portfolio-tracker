// Transactions API service. Uses the generic http client.
// Backend endpoints (adjust paths on the NestJS side if different):
//   GET    /transactions            -> Transaction[]
//   POST   /transactions            -> Transaction
//   DELETE /transactions/:id        -> void

import { http } from "@/lib/http";
import { Transaction, TxType } from "@/types";

export type CreateTransactionDto = Omit<Transaction, "id" | "stock">;

export const transactionsApi = {
  list: (params?: { portfolioId?: string; type?: TxType }) =>
    http.get<Transaction[]>("/transactions/profile", { params }),
  create: (dto: CreateTransactionDto) => http.post<Transaction>("/transactions", dto),
  remove: (id: string) => http.delete<void>(`/transactions/${id}`),
};
