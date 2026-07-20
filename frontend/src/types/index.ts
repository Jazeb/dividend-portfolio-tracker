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
  portfolioId: number;
  stocks: Stock;
}

export interface PortfolioDashboard {
  id: number;
  name: string;
  strategy: string;
  description: string;
  annualIncome: number;
  monthlyIncome: number;
  lifetimeIncome: number;
  upcomingDividend: number;
  yield: number;
  yieldOnCost: number;
  holdings: Holding[];
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
  fullName: string;
  eligibleShares: string;
  dividendPerShare: string;
  grossDividend: string;
  taxAmount: string;
  netDividend: string;
  paymentDate: string;
  status: string;
  exDividendDate: string;

  // symbol: string;
  // company: string;
  // amount: string; // e.g. "PKR 3.5/sh"
  // exDate: string;
  // payDate: string;
  // total: number;
}

export interface MonthlyDividend {
  month: string;
  amount: number;
}

export interface DividendGrowthPoint {
  year: string;
  amount: number;
}

export interface SectorAllocation {
  name: string;
  value: number;
}
