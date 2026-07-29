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

// export interface Holding {
//   id: number;
//   quantity: number;
//   avgPrice: number;
//   totalCost: number;
//   portfolioId: number;
//   stocks: Stock;
// }

export type TxType = "Buy" | "Sell" | "Dividend" | "Bonus" | "Rights" | "Split" | "Transfer";

export interface Transaction {
  id: string;
  purchaseDate: string;
  transactionType: TxType;
  symbol?: string;
  quantity: number;
  buyingPrice: number;
  totalBuyingPrice: number;
  portfolioId: number | string;
  broker?: string;
  stock: Stock;
}

export interface Holding {
  id: number;
  symbol: string;
  fullName: string;
  sector: string;
  quantity: string;
  avgPrice: string;
  invested: number;
  currentPrice: number;
  annualDividend: number;
  marketValue: number;
  yield: string;
  yoc: number;
  pl: number;
}

export interface PortfolioDashboard {
  id: number;
  name: string;
  portfolioCost: number;
  holdingsCount: number;
  portfolioNetworth: number;
  portfolioProfit: number;
  profitPercent: number;
  annualDividendIncome: number;
  yield: number;
}

export interface Portfolio {
  id: number;
  name: string;
  strategy: string;
  description: string;
  portfolioCost: number;
  holdingsCount: number;
  portfolioNetworth: number;
  portfolioProfit: number;
  profitPercent: number;
  annualDividendIncome: number;
  yield: number;
  createdAt?: string;
  holdings?: Holding[];
  upcomingDividend?: UpcomingDividend[];
  monthlyDividends?: MonthlyDividend[];
}

export interface DividendHistory {
  symbol: string;
  fullName: string;
  eligibleShares: string;
  dividendPerShare: string;
  grossDividend: string;
  taxAmount: string;
  netDividend: string;
  paymentDate: string;
  status: string;
  exDividendDate: string;
}

export interface UpcomingDividend {
  symbol: string;
  company: string;
  amount: string; // e.g. "PKR 3.5/sh"
  exDate: string;
  payDate: string;
  total: number;
  afterTax: number;
  status: string;
}

export interface MonthlyDividend {
  month: string;
  gross: string;
}

export interface DividendGrowthPoint {
  year: string;
  amount: number;
}

export interface SectorAllocation {
  name: string;
  value: number;
}

export type UpcomingRow = {
  id: string;
  symbol: string;
  company: string;
  dps: number;
  shares: number;
  gross: number;
  tax: number;
  net: number;
  exDate: string;
  bookClosure: string;
  payDate: string;
  status: "Upcoming" | "Processing";
};

export type HistoryRow = {
  id: string;
  symbol: string;
  company: string;
  dps: number;
  shares: number;
  gross: number;
  tax: number;
  net: number;
  exDate: string;
  bookClosure: string;
  payDate: string;
  status: "Paid";
};

export interface DividendGrowthPoint {
  year: string;
  amount: number;
}

export interface SectorAllocation {
  name: string;
  value: number;
}

export interface UpcomingDividend {
  symbol: string;
  company: string;
  amount: string;
  exDate: string;
  payDate: string;
  total: number;
}

// ----- Portfolio-scoped dashboard --------------------------------

export type DividendItemStatus = "UPCOMING" | "PROCESSING" | "PAID";

export interface DividendSummary {
  annualIncome: number;
  monthlyIncome: number;
  lifetimeIncome: number;
  upcomingDividend: number;
  yield: number;
  yieldOnCost: number;
}

export interface DividendItem {
  id: string;
  stock: string;
  company: string;
  eligibleShares: number;
  dividendPerShare: number;
  grossDividend: number;
  taxAmount: number;
  netDividend: number;
  paymentDate: string;
  exDividendDate: string;
  bookClosureDate: string;
  status: DividendItemStatus;
}

export interface DividendStockBreakdown {
  symbol: string;
  company: string;
  annualIncome: number;
  yield: number;
  yieldOnCost: number;
  contribution: number;
}

export interface DividendSectorBreakdown {
  sector: string;
  annualIncome: number;
}

export interface DividendCalendarItem {
  stock: string;
  paymentDate: string;
  dividendPerShare: number;
}

export interface DividendIncomeTrendPoint {
  month: string;
  income: number;
}

export interface DividendDashboard {
  summary: DividendSummary;
  upcoming: DividendItem[];
  history: DividendItem[];
  breakdownByStock: DividendStockBreakdown[];
  breakdownBySector: DividendSectorBreakdown[];
  calendar: DividendCalendarItem[];
  incomeTrend: DividendIncomeTrendPoint[];
  monthlyDividends: MonthlyDividend[];
}
