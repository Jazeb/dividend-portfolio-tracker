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
  portfolioId: string;
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
  createdAt: string;
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
