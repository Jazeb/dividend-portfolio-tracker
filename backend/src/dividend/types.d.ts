type DividendCalendarQueryTypes = {
    portfolioId: string, 
    month: string, 
    year: string, 
    eventType: string
}

type DividendEventType =
  | "PAYMENT"
  | "EX_DATE"
  | "BOOK_CLOSURE"
  | "ANNOUNCEMENT";

type DividendEventStatus = "UPCOMING" | "PROCESSING" | "PAID";

type DividendCalendarEvent = {
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