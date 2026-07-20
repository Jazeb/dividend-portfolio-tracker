import { PortfolioDashboard, Holding } from "@/types";

export type Sector = {
  id: number;
  name: string;
};

export type Stock = {
  id: number;
  fullName: string;
  symbol: string;
  currentPrice: number;
  annualDividend: number;
  dividendYield: number;
  sector: Sector;
};

// export type Holding = {
//   symbol: string;
//   name: string;
//   sector: string;
//   quantity: number;
//   avgPrice: number;
//   currentPrice: number;
//   dividendYield: number;
//   yieldOnCost: number;
//   annualDividend: number;
//   portfolioId: number;
//   stocks: Stock;
// };

export const holdings: Holding[] = [
  // {
  //   symbol: "OGDC",
  //   name: "Oil & Gas Development",
  //   sector: "Energy",
  //   quantity: 1200,
  //   avgPrice: 88.5,
  //   currentPrice: 142.3,
  //   dividendYield: 8.4,
  //   yieldOnCost: 12.9,
  //   annualDividend: 14,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "MCB",
  //   name: "MCB Bank Limited",
  //   sector: "Banking",
  //   quantity: 800,
  //   avgPrice: 168.2,
  //   currentPrice: 218.4,
  //   dividendYield: 10.1,
  //   yieldOnCost: 14.2,
  //   annualDividend: 22,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "ENGRO",
  //   name: "Engro Corporation",
  //   sector: "Conglomerate",
  //   quantity: 500,
  //   avgPrice: 245.0,
  //   currentPrice: 312.6,
  //   dividendYield: 9.6,
  //   yieldOnCost: 12.4,
  //   annualDividend: 30,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "LUCK",
  //   name: "Lucky Cement",
  //   sector: "Cement",
  //   quantity: 300,
  //   avgPrice: 512.0,
  //   currentPrice: 782.5,
  //   dividendYield: 4.2,
  //   yieldOnCost: 6.4,
  //   annualDividend: 33,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "PSO",
  //   name: "Pakistan State Oil",
  //   sector: "Energy",
  //   quantity: 700,
  //   avgPrice: 178.0,
  //   currentPrice: 224.9,
  //   dividendYield: 7.1,
  //   yieldOnCost: 9.0,
  //   annualDividend: 16,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "HBL",
  //   name: "Habib Bank Limited",
  //   sector: "Banking",
  //   quantity: 950,
  //   avgPrice: 96.4,
  //   currentPrice: 132.2,
  //   dividendYield: 9.8,
  //   yieldOnCost: 13.4,
  //   annualDividend: 13,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "FFC",
  //   name: "Fauji Fertilizer",
  //   sector: "Fertilizer",
  //   quantity: 1500,
  //   avgPrice: 108.5,
  //   currentPrice: 148.0,
  //   dividendYield: 12.5,
  //   yieldOnCost: 17.0,
  //   annualDividend: 18.5,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "PPL",
  //   name: "Pakistan Petroleum",
  //   sector: "Energy",
  //   quantity: 600,
  //   avgPrice: 82.0,
  //   currentPrice: 118.6,
  //   dividendYield: 6.2,
  //   yieldOnCost: 9.0,
  //   annualDividend: 7.4,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "UBL",
  //   name: "United Bank Limited",
  //   sector: "Banking",
  //   quantity: 450,
  //   avgPrice: 152.0,
  //   currentPrice: 208.5,
  //   dividendYield: 11.2,
  //   yieldOnCost: 15.4,
  //   annualDividend: 23.5,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
  // {
  //   symbol: "MEBL",
  //   name: "Meezan Bank",
  //   sector: "Banking",
  //   quantity: 620,
  //   avgPrice: 128.0,
  //   currentPrice: 192.4,
  //   dividendYield: 8.8,
  //   yieldOnCost: 13.2,
  //   annualDividend: 17,
  //   stocks: {
  //     id: 1,
  //     fullName: 'Meezan Bank',
  //     symbol: 'MEBL'
  //   }
  // },
];

export const portfolios: PortfolioDashboard[] = [
  {
    id: 1,
    name: "Dividend-Jazeb",
    strategy: "Dividend Growth",
    description: "ferf",
    annualIncome: 0,
    monthlyIncome: 0,
    lifetimeIncome: 0,
    upcomingDividend: 0,
    yield: 0,
    yieldOnCost: 0,
    holdings: [],
  },
  //   {
  //     id: "dividend",
  //     name: "Dividend Portfolio",
  //     // value: 2_845_000,
  //     // cost: 2_120_000,
  //     // dividendIncome: 268_400,
  //     // holdings: 12,
  //     // yield: 9.4,
  //     holdings: [
  //       {
  //         id: 1,
  //         quantity: 1000,
  //         avgPrice: 500,
  //         totalCost: 450.4,
  //         stocks: {
  //           id: 1,
  //           fullName: "Meezan Bank",
  //           symbol: "MEBL",
  //           currentPrice: 500,
  //           dividendYield: 10,
  //           annualDividend: 28,
  //           sector: {
  //             id: 1,
  //             name: "Banking",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   {
  //     id: "retirement",
  //     name: "Retirement Portfolio",
  //     // value: 1_620_000,
  //     // cost: 1_380_000,
  //     // dividendIncome: 142_800,
  //     // holdings: 8,
  //     // yield: 8.8,
  //     holdings: [
  //       {
  //         id: 1,
  //         quantity: 1000,
  //         avgPrice: 500,
  //         totalCost: 450.4,
  //         stocks: {
  //           id: 1,
  //           fullName: "Meezan Bank",
  //           symbol: "MEBL",
  //           currentPrice: 500,
  //           dividendYield: 10,
  //           annualDividend: 28,
  //           sector: {
  //             id: 1,
  //             name: "Banking",
  //           },
  //         },
  //       },
  //     ],
  //   },
  //   {
  //     id: "education",
  //     name: "Children Education",
  //     // value: 685_000,
  //     // cost: 610_000,
  //     // dividendIncome: 54_200,
  //     // holdings: 6,
  //     // yield: 7.9,
  //     holdings: [
  //       {
  //         id: 1,
  //         quantity: 1000,
  //         avgPrice: 500,
  //         totalCost: 450.4,
  //         stocks: {
  //           id: 1,
  //           fullName: "Meezan Bank",
  //           symbol: "MEBL",
  //           currentPrice: 500,
  //           dividendYield: 10,
  //           annualDividend: 28,
  //           sector: {
  //             id: 1,
  //             name: "Banking",
  //           },
  //         },
  //       },
  //     ],
  //   },
];

export const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const portfolioGrowth = monthLabels.map((m, i) => ({
  month: m,
  value: 1_800_000 + i * 90_000 + Math.round(Math.sin(i) * 60000),
  cost: 1_600_000 + i * 45_000,
}));

export const dividendGrowth = [
  { year: "2019", amount: 42_000 },
  { year: "2020", amount: 68_000 },
  { year: "2021", amount: 112_000 },
  { year: "2022", amount: 168_000 },
  { year: "2023", amount: 224_000 },
  { year: "2024", amount: 312_000 },
  { year: "2025", amount: 386_000 },
  { year: "2026 (est)", amount: 465_400 },
];

export const sectorAllocation = [
  { name: "Banking", value: 34 },
  { name: "Energy", value: 26 },
  { name: "Fertilizer", value: 14 },
  { name: "Cement", value: 12 },
  { name: "Conglomerate", value: 9 },
  { name: "Other", value: 5 },
];

export const monthlyDividends = monthLabels.map((m, i) => ({
  month: m,
  amount: [18, 42, 15, 68, 24, 55, 22, 71, 34, 88, 28, 62][i] * 1000,
}));

export const upcomingDividends = [
  {
    symbol: "OGDC",
    company: "Oil & Gas Development",
    amount: "PKR 3.5/sh",
    exDate: "2026-07-18",
    payDate: "2026-08-02",
    total: 4200,
  },
  {
    symbol: "MCB",
    company: "MCB Bank",
    amount: "PKR 5.5/sh",
    exDate: "2026-07-22",
    payDate: "2026-08-10",
    total: 4400,
  },
  {
    symbol: "ENGRO",
    company: "Engro Corporation",
    amount: "PKR 7.5/sh",
    exDate: "2026-07-25",
    payDate: "2026-08-14",
    total: 3750,
  },
  {
    symbol: "FFC",
    company: "Fauji Fertilizer",
    amount: "PKR 4.5/sh",
    exDate: "2026-07-29",
    payDate: "2026-08-18",
    total: 6750,
  },
  {
    symbol: "HBL",
    company: "Habib Bank",
    amount: "PKR 3.25/sh",
    exDate: "2026-08-04",
    payDate: "2026-08-22",
    total: 3087,
  },
];

export const recentTransactions = [
  { date: "2026-07-05", type: "Buy", symbol: "MEBL", qty: 120, price: 192.4, total: 23_088 },
  { date: "2026-07-03", type: "Dividend", symbol: "OGDC", qty: 1200, price: 3.5, total: 4_200 },
  { date: "2026-06-28", type: "Buy", symbol: "UBL", qty: 50, price: 208.5, total: 10_425 },
  { date: "2026-06-24", type: "Sell", symbol: "LUCK", qty: 20, price: 782.5, total: 15_650 },
  { date: "2026-06-18", type: "Bonus", symbol: "ENGRO", qty: 25, price: 0, total: 0 },
];

export const notifications = [
  {
    id: 1,
    type: "Dividend",
    title: "MCB announces PKR 5.5/sh dividend",
    time: "2h ago",
    unread: true,
  },
  { id: 2, type: "Milestone", title: "Portfolio crossed PKR 5M", time: "5h ago", unread: true },
  { id: 3, type: "Reminder", title: "OGDC book closure on Jul 18", time: "1d ago", unread: true },
  {
    id: 4,
    type: "Corporate",
    title: "ENGRO 5% bonus share credited",
    time: "2d ago",
    unread: false,
  },
  {
    id: 5,
    type: "Goal",
    title: "You reached 68% of monthly dividend goal",
    time: "3d ago",
    unread: false,
  },
];

export const watchlist = [
  {
    symbol: "SYS",
    name: "Systems Limited",
    price: 528.4,
    change: 2.4,
    yield: 3.2,
    high52: 612,
    low52: 320,
    growth: 18.2,
    mcap: "148B",
  },
  {
    symbol: "SEARL",
    name: "Searle Company",
    price: 88.2,
    change: -1.1,
    yield: 4.8,
    high52: 112,
    low52: 62,
    growth: 6.4,
    mcap: "24B",
  },
  {
    symbol: "INDU",
    name: "Indus Motor",
    price: 1682,
    change: 0.8,
    yield: 9.2,
    high52: 1912,
    low52: 1180,
    growth: 12.6,
    mcap: "132B",
  },
  {
    symbol: "NESTLE",
    name: "Nestle Pakistan",
    price: 6820,
    change: -0.4,
    yield: 5.6,
    high52: 7420,
    low52: 5100,
    growth: 8.2,
    mcap: "309B",
  },
  {
    symbol: "COLG",
    name: "Colgate Palmolive",
    price: 2984,
    change: 1.6,
    yield: 6.4,
    high52: 3200,
    low52: 2400,
    growth: 10.4,
    mcap: "48B",
  },
  {
    symbol: "POL",
    name: "Pakistan Oilfields",
    price: 612,
    change: 3.2,
    yield: 11.4,
    high52: 682,
    low52: 380,
    growth: 14.8,
    mcap: "173B",
  },
];

export const dividendEvents = [
  { day: 3, symbol: "PSO", amount: 4 },
  { day: 8, symbol: "LUCK", amount: 8 },
  { day: 14, symbol: "FFC", amount: 4.5 },
  { day: 18, symbol: "OGDC", amount: 3.5 },
  { day: 22, symbol: "MCB", amount: 5.5 },
  { day: 25, symbol: "ENGRO", amount: 7.5 },
  { day: 29, symbol: "HBL", amount: 3.25 },
];

export function pkr(n: number) {
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `PKR ${(n / 1_000).toFixed(1)}K`;
  return `PKR ${n.toFixed(0)}`;
}
