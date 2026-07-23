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
  createdAt: string;
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
