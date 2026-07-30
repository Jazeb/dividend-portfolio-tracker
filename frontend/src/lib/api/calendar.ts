// Dividend Calendar API
//   GET /dividends/calendar?portfolioId&month&year&eventType&stockId&status

import { http } from "@/lib/http";

export type DividendEventType =
  | "PAYMENT"
  | "EX_DATE"
  | "BOOK_CLOSURE"
  | "ANNOUNCEMENT";

export type DividendEventStatus = "UPCOMING" | "PROCESSING" | "PAID";

export interface DividendCalendarEvent {
  stockId: number;
  symbol: string;
  company: string;
  sector: string;
  eventType: DividendEventType;
  eventDate: string; // ISO
  dividendPerShare: number;
  eligibleShares: number;
  grossDividend: number;
  tax: number;
  netDividend: number;
  announcementDate: string;
  exDate: string;
  bookClosureStart: string;
  bookClosureEnd: string;
  paymentDate: string;
  status: DividendEventStatus;
  portfolioId: string;
  portfolioName: string;
  holdingValue: number;
  currentYield: number;
  yieldOnCost: number;
}

export interface DividendCalendarSummary {
  companies: number;
  expectedDividend: number;
  nextEvent: { stock: string; date: string; type: DividendEventType } | null;
  largestDividend: { stock: string; amount: number } | null;
}

export interface DividendCalendarResponse {
  summary: DividendCalendarSummary;
  events: DividendCalendarEvent[];
}

export interface DividendCalendarParams {
  portfolioId?: string;
  month: number; // 1-12
  year: number;
  eventType?: DividendEventType;
  stockId?: string;
  status?: DividendEventStatus | "ALL";
}

export const calendarApi = {
  get: (params: DividendCalendarParams) =>
    http.get<DividendCalendarResponse>("/dividends/calendar", {
      params: params as unknown as Record<string, string | number | boolean | null | undefined>,
    }),
};
