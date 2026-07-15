import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Coins,
  CalendarDays,
  CheckCircle2,
  Clock,
  TrendingUp,
  Wallet,
  Percent,
  Target,
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  dividendGrowth as seedGrowth,
  sectorAllocation as seedSectors,
  holdings as seedHoldings,
  monthlyDividends as seedMonthly,
  pkr,
  monthLabels,
  // holdings,
} from "@/lib/mock-data";
import {
  type UpcomingDividend,
  type MonthlyDividend,
  type DividendGrowthPoint,
  type SectorAllocation,
  Portfolio,
  Holding,
} from "@/types";
import { portfoliosApi } from "@/lib/api/portfolios";
import { dividendsApi } from "@/lib/api/dividends";
import { holdingsApi } from "@/lib/api/holdings";
import { cn } from "@/lib/utils";

// When VITE_API_BASE_URL is unset (e.g. on Lovable preview), fall back to seed data.
const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

export const Route = createFileRoute("/_app/dividends")({
  component: DividendsPage,
  head: () => ({
    meta: [
      { title: "Dividends — PSX Dividend Tracker" },
      {
        name: "description",
        content:
          "Track dividend income, upcoming payments, history, projections, and growth across your PSX portfolios.",
      },
    ],
  }),
});

const rawColors = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
  "#64748b",
];
const TAX_RATE = 0.15;

type DividendRecord = {
  id: string;
  payDate: string;
  exDate: string;
  bookClosure: string;
  symbol: string;
  company: string;
  dps: number;
  shares: number;
  gross: number;
  tax: number;
  net: number;
  status: "Paid" | "Processing" | "Upcoming";
};

// ---- Synthetic history (12 months of paid dividends) --------------------
function buildHistory(holdings: Holding[]): DividendRecord[] {
  const records: DividendRecord[] = [];
  const now = new Date(2026, 6, 14); // Jul 14 2026
  holdings.forEach((h, hi) => {
    // 2 to 4 payouts across the last 18 months
    const payouts = 2 + (hi % 3);
    for (let i = 0; i < payouts; i++) {
      const monthsAgo = 2 + i * 4 + (hi % 2);
      const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 8 + (hi % 18));
      const dps = +(h.stocks.annualDividend / payouts).toFixed(2);
      const gross = +(dps * h.quantity).toFixed(0);
      const tax = +(gross * TAX_RATE).toFixed(0);
      records.push({
        id: `${h.stocks.symbol}-${d.getTime()}`,
        payDate: d.toISOString().slice(0, 10),
        exDate: new Date(d.getTime() - 15 * 86400000).toISOString().slice(0, 10),
        bookClosure: new Date(d.getTime() - 10 * 86400000).toISOString().slice(0, 10),
        symbol: h.stocks.symbol,
        company: h.stocks.fullName,
        dps,
        shares: h.quantity,
        gross,
        tax,
        net: gross - tax,
        status: monthsAgo <= 1 ? "Processing" : "Paid",
      });
    }
  });
  return records.sort((a, b) => (a.payDate < b.payDate ? 1 : -1));
}

// Enrich upcoming with tax breakdown
type UpcomingRow = {
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

function calculateAnnualIncome(holdings: Holding[]) {
  let annualIncome = 0;
  holdings.map(holding => annualIncome += Number(holding.quantity) * holding.stocks.annualDividend);
  return annualIncome;
}

function buildUpcomingRows(source: UpcomingDividend[], holdings: Holding[]): UpcomingRow[] {
  return (source ?? []).map((u, i) => {
    const dps = parseFloat(u.dividendPerShare.replace(/[^0-9.]/g, ""));
    const h = holdings.find((x) => x.stocks.symbol === u.stock.symbol);
    if (!h) return {};
    const shares = h.quantity;
    const gross = Math.round(dps * shares);
    const tax = Math.round(gross * TAX_RATE);
    return {
      id: `up-${u.stock.symbol}`,
      symbol: u.stock.symbol,
      company: u.stock.fullName,
      dps,
      shares,
      gross,
      tax,
      net: gross - tax,
      exDate: u.exDividendDate,
      bookClosure: new Date(new Date(u.exDividendDate).getTime() + 5 * 86400000).toISOString().slice(0, 10),
      payDate: u.paymentDate,
      status: i === 0 ? "Processing" : "Upcoming",
    };
  });
}

const statusStyles: Record<string, string> = {
  Paid: "bg-success/12 text-success border-success/20",
  Processing: "bg-warning/12 text-warning border-warning/20",
  Upcoming: "bg-primary/12 text-primary border-primary/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-[10px] uppercase tracking-wider", statusStyles[status] ?? "")}
    >
      {status}
    </Badge>
  );
}

// ---- Component ---------------------------------------------------------
function DividendsPage() {
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const [trendRange, setTrendRange] = useState<"1Y" | "3Y" | "5Y" | "ALL">("1Y");
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<string>("all");
  const [historySort, setHistorySort] = useState<"date-desc" | "date-asc" | "net-desc">("date-desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [drawer, setDrawer] = useState<DividendRecord | UpcomingRow | null>(null);
  const [calMonth, setCalMonth] = useState(new Date(2026, 6, 1));
  const [upcomingSort, setUpcomingSort] = useState<"payDate" | "net">("payDate");

  // --- API queries (fallback to seed data when API is disabled) ---

  const upcomingQuery = useQuery<UpcomingDividend[]>({
    queryKey: ["dividends", "upcoming"],
    queryFn: () => dividendsApi.upcoming(),
    enabled: API_ENABLED,
    // initialData: API_ENABLED ? undefined : seedUpcoming,
    // placeholderData: seedUpcoming,
    retry: 1,
  });
  const monthlyQuery = useQuery<MonthlyDividend[]>({
    queryKey: ["dividends", "monthly"],
    queryFn: () => dividendsApi.monthly(),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : seedMonthly,
    placeholderData: seedMonthly,
    retry: 1,
  });
  const growthQuery = useQuery<DividendGrowthPoint[]>({
    queryKey: ["dividends", "growth"],
    queryFn: () => dividendsApi.growth(),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : seedGrowth,
    placeholderData: seedGrowth,
    retry: 1,
  });
  const sectorsQuery = useQuery<SectorAllocation[]>({
    queryKey: ["dividends", "sectors"],
    queryFn: () => dividendsApi.sectors(),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : seedSectors,
    placeholderData: seedSectors,
    retry: 1,
  });
  const portfolioQuery = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => portfoliosApi.list(),
    staleTime: 5 * 60_000,
  });
  const holdingsQuery = useQuery({
    queryKey: ["holdings"],
    queryFn: () => holdingsApi.list(),
    enabled: API_ENABLED,
    retry: 1,
  });

  const upcomingSource = upcomingQuery.data as any; // ?? seedUpcoming;
  const monthlySource = monthlyQuery.data ?? seedMonthly;
  const growthSource = growthQuery.data ?? seedGrowth;
  const sectorsSource = sectorsQuery.data ?? seedSectors;
  const holdings: Holding[] = holdingsQuery.data ?? [];
  const portfolios: Portfolio[] = portfolioQuery.data ?? [];

  console.log({ growthSource })
  const upcomingRows = useMemo(() => buildUpcomingRows(upcomingSource, holdings), [upcomingSource]);

  // Deterministically assign each holding to a portfolio
  const holdingsWithPortfolio = holdings?.map((h, i) => ({
    ...h,
    portfolioId: portfolios[i % portfolios.length].id,
  }));

  const activePortfolio = portfolios.find((p) => p.id === portfolioFilter);
  const filteredHoldings = useMemo(
    () =>
      portfolioFilter === "all"
        ? holdingsWithPortfolio
        : holdingsWithPortfolio?.filter((h) => h.portfolioId === portfolioFilter),
    [portfolioFilter],
  );
  const symbolSet = useMemo(
    () => new Set(filteredHoldings?.map((h) => h.stocks.symbol)),
    [filteredHoldings],
  );

  const history = buildHistory(holdings);

  const scale = useMemo(() => {
    if (portfolioFilter === "all") return 1;
    const total = holdingsWithPortfolio?.reduce((s, h) => s + h.stocks.annualDividend * h.quantity, 0);
    const filtered = filteredHoldings.reduce((s, h) => s + h.stocks.annualDividend * h.quantity, 0);
    return total > 0 ? filtered / total : 0;
  }, [portfolioFilter, filteredHoldings]);

  const scaled = (n: number) => Math.round(n * scale);

  const filteredUpcoming = useMemo(() => {
    const rows =
      portfolioFilter === "all"
        ? upcomingRows
        : upcomingRows.filter((r) => symbolSet.has(r.symbol));

    return [...rows].sort((a, b) => {
      if (upcomingSort === "net") return b.net - a.net;
      return a.payDate < b.payDate ? -1 : 1;
    });
  }, [portfolioFilter, symbolSet, upcomingSort, upcomingRows]);

  const filteredHistory = useMemo(() => {
    let rows = portfolioFilter === "all" ? history : history.filter((r) => symbolSet.has(r.symbol));
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      rows = rows.filter(
        (r) => r.symbol.toLowerCase().includes(q) || r.company.toLowerCase().includes(q),
      );
    }
    if (historyStatus !== "all") rows = rows.filter((r) => r.status === historyStatus);
    rows = [...rows].sort((a, b) => {
      if (historySort === "net-desc") return b.net - a.net;
      if (historySort === "date-asc") return a.payDate < b.payDate ? -1 : 1;
      return a.payDate < b.payDate ? 1 : -1;
    });
    return rows;
  }, [portfolioFilter, symbolSet, historySearch, historyStatus, historySort]);

  const pagedHistory = filteredHistory.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

  // --- KPI calculations ---
  const annualIncome = calculateAnnualIncome(holdings);
  const monthlyAvg = Math.round(annualIncome / 12);
  const upcomingAmount = filteredUpcoming.reduce((s, r) => s + r.net, 0);
  const pendingAmount = filteredUpcoming.reduce((s, r) => s + r.net, 0);
  const lifetimeReceived = scaled(growthSource.slice(0, -1).reduce((s, d) => s + d.amount, 0));
  const totalMarketValue =
    filteredHoldings.reduce((s, h) => s + h.quantity * h.stocks.currentPrice, 0) || 1;
  const totalCost = filteredHoldings.reduce((s, h) => s + h.quantity * h.avgPrice, 0) || 1;
  const avgYield =
    filteredHoldings.reduce((s, h) => s + h.stocks.dividendYield * h.quantity * h.stocks.currentPrice, 0) /
    totalMarketValue;
  const yieldOnCost =
    (filteredHoldings.reduce((s, h) => s + h.stocks.annualDividend * h.quantity, 0) / totalCost) * 100;

  // --- Chart data ---
  const scaledGrowth = useMemo(
    () => growthSource.map((d) => ({ ...d, amount: scaled(d.amount) })),
    [scale, growthSource],
  );
  const scaledMonthly = useMemo(
    () => monthlySource.map((d) => ({ ...d, amount: scaled(d.amount) })),
    [scale, monthlySource],
  );
  const sectorData = useMemo<SectorAllocation[]>(() => {
    if (portfolioFilter === "all") return sectorsSource;
    const bySector = new Map<string, number>();
    filteredHoldings.forEach((h) => {
      bySector.set(h.stocks.sector.name, (bySector.get(h.stocks.sector.name) ?? 0) + h.stocks.annualDividend * h.quantity);
    });
    const total = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
    return [...bySector.entries()].map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
    }));
  }, [portfolioFilter, filteredHoldings, sectorsSource]);

  const trendData = useMemo(() => {
    const years = { "1Y": 1, "3Y": 3, "5Y": 5, ALL: growthSource.length }[trendRange];
    return scaledGrowth.slice(-years);
  }, [trendRange, scaledGrowth, growthSource.length]);

  console.log({ trendData })
  // --- Projections ---
  const nextMonth = Math.round(annualIncome / 12);
  const nextQuarter = Math.round(annualIncome / 4);
  const nextYearProjected = Math.round(annualIncome * 1.12);

  // --- Calendar events ---
  const calendarEvents = useMemo(() => {
    const map = new Map<string, { type: "ex" | "book" | "pay"; row: UpcomingRow }[]>();
    const push = (date: string, type: "ex" | "book" | "pay", row: UpcomingRow) => {
      const arr = map.get(date) ?? [];
      arr.push({ type, row });
      map.set(date, arr);
    };
    filteredUpcoming.forEach((r) => {
      push(r.exDate, "ex", r);
      push(r.bookClosure, "book", r);
      push(r.payDate, "pay", r);
    });
    return map;
  }, [filteredUpcoming]);

  // --- Empty state ---
  // if (filteredHoldings.length === 0) {
  //   return (
  //     <>
  //       <PageHeader title="Dividends" description="Your dividend income at a glance" />
  //       <Card className="card-elevated p-12 text-center flex flex-col items-center gap-4">
  //         <div className="h-14 w-14 rounded-2xl gradient-primary grid place-items-center">
  //           <Coins className="h-7 w-7 text-primary-foreground" />
  //         </div>
  //         <div>
  //           <h2 className="text-lg font-semibold">No dividend income yet.</h2>
  //           <p className="text-sm text-muted-foreground mt-1">
  //             Add your first transaction to start tracking dividend payments.
  //           </p>
  //         </div>
  //         <Button className="gap-2">
  //           <Sparkles className="h-4 w-4" />
  //           Add Your First Transaction
  //         </Button>
  //       </Card>
  //     </>
  //   );
  // }

  // --- Export ---
  const exportCSV = () => {
    const header = [
      "Payment Date",
      "Symbol",
      "Company",
      "DPS",
      "Shares",
      "Gross",
      "Tax",
      "Net",
      "Status",
    ];
    const rows = filteredHistory.map((r) => [
      r.payDate,
      r.symbol,
      r.company,
      r.dps,
      r.shares,
      r.gross,
      r.tax,
      r.net,
      r.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dividend-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Dividends"
        description="Track income, upcoming payments, history & projections"
        actions={
          <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
            <SelectTrigger className="h-9 w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portfolios</SelectItem>
              {portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {activePortfolio && (
        <div className="mb-4 text-xs text-muted-foreground">
          Showing dividends for{" "}
          <span className="font-medium text-foreground">{activePortfolio.name}</span> ·{" "}
          {filteredHoldings.length} holdings
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <StatCard
          label="Annual Income"
          value={pkr(annualIncome)}
          delta={24.2}
          icon={<Coins className="h-4 w-4" />}
          tone="primary"
        />
        <StatCard
          label="Monthly Avg"
          value={pkr(monthlyAvg)}
          delta={6.4}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Upcoming"
          value={pkr(upcomingAmount)}
          sub="next 30d"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Pending"
          value={pkr(pendingAmount)}
          sub={`${filteredUpcoming.length} events`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Received (Lifetime)"
          value={pkr(lifetimeReceived)}
          delta={18.4}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Avg Yield"
          value={`${avgYield.toFixed(2)}%`}
          sub="portfolio"
          icon={<Percent className="h-4 w-4" />}
        />
        <StatCard
          label="Yield on Cost"
          value={`${yieldOnCost.toFixed(2)}%`}
          sub="on invested"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {/* Upcoming Dividends */}
      <Card className="card-elevated mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Upcoming Dividends</CardTitle>
            <CardDescription>Next payouts across your holdings</CardDescription>
          </div>
          <Select value={upcomingSort} onValueChange={(v: "payDate" | "net") => setUpcomingSort(v)}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="payDate">Sort by pay date</SelectItem>
              <SelectItem value="net">Sort by amount</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">DPS</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Tax (15%)</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Ex-Date</TableHead>
                <TableHead>Book Closure</TableHead>
                <TableHead>Pay Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUpcoming.map((r) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setDrawer(r)}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center text-[10px] font-bold">
                        {r.symbol}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">{r.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {r.company}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.dps.toFixed(2)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.shares.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.gross.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    −{r.tax.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-success">
                    {r.net.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.exDate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.bookClosure}</TableCell>
                  <TableCell className="text-xs">{r.payDate}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Calendar + Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Dividend Calendar</CardTitle>
              <CardDescription>Ex-date, book closure & payment events</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium w-32 text-center">
                {monthLabels[calMonth.getMonth()]} {calMonth.getFullYear()}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarGrid month={calMonth} events={calendarEvents} onSelect={setDrawer} />
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-warning" /> Ex-Date
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> Book Closure
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" /> Payment
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">By Sector</CardTitle>
            <CardDescription>Income breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sectorData}
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={rawColors[i % rawColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {sectorData.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: rawColors[i % rawColors.length] }}
                    />
                    {s.name}
                  </span>
                  <span className="tabular-nums font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Trend + Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Dividend Income Trend</CardTitle>
              <CardDescription>Track how your income evolves</CardDescription>
            </div>
            <Tabs value={trendRange} onValueChange={(v) => setTrendRange(v as typeof trendRange)}>
              <TabsList className="h-8">
                <TabsTrigger value="1Y" className="text-xs h-6">
                  1Y
                </TabsTrigger>
                <TabsTrigger value="3Y" className="text-xs h-6">
                  3Y
                </TabsTrigger>
                <TabsTrigger value="5Y" className="text-xs h-6">
                  5Y
                </TabsTrigger>
                <TabsTrigger value="ALL" className="text-xs h-6">
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendRange === "1Y" ? scaledMonthly : trendData}>
                <defs>
                  <linearGradient id="gLine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis
                  dataKey={trendRange === "1Y" ? "month" : "year"}
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base">Dividend Growth</CardTitle>
            <CardDescription>Year over year</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scaledGrowth.slice(-5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ProjectionCard
          label="Next Month"
          amount={nextMonth}
          hint="Based on scheduled payouts"
          tone="primary"
        />
        <ProjectionCard label="Next Quarter" amount={nextQuarter} hint="Assumes no new purchases" />
        <ProjectionCard
          label="Next Year (Projected)"
          amount={nextYearProjected}
          hint="+12% growth assumption"
          delta={12}
        />
      </div>

      {/* Breakdown by Stock */}
      <Card className="card-elevated mb-6">
        <CardHeader>
          <CardTitle className="text-base">Breakdown by Stock</CardTitle>
          <CardDescription>Annual contribution, yield & YoC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredHoldings.map((h) => {
            console.log({ filteredHoldings })
            const income = h.stocks.annualDividend * h.quantity;
            const total =
              filteredHoldings.reduce((s, x) => s + x.stocks.annualDividend * x.quantity, 0) || 1;
            const shareOfPortfolio = (income / total) * 100;
            const yoc = ((h.stocks.annualDividend / h.avgPrice) * 100).toFixed(2);
            const dYield = (h.stocks.annualDividend / h.stocks.currentPrice).toFixed(2);
            return (
              <div key={h.stocks.symbol} className="grid grid-cols-[110px_1fr_auto] gap-3 items-center">
                <div>
                  <div className="text-sm font-semibold">{h.stocks.symbol}</div>
                  <div className="text-[10px] text-muted-foreground">{h.stocks.sector.name}</div>
                </div>
                <div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full"
                      style={{ width: `${Math.min(shareOfPortfolio, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    <span>Yield {dYield}%</span>
                    <span className="text-primary">YoC {yoc}%</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-sm font-semibold">{pkr(income)}</div>
                  <Badge variant="secondary" className="text-[10px]">
                    {shareOfPortfolio.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* History */}
      <Card className="card-elevated">
        <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Dividend History</CardTitle>
            <CardDescription>
              {filteredHistory.length} payment{filteredHistory.length !== 1 && "s"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search…"
                className="pl-9 h-8 w-[180px]"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={historyStatus}
              onValueChange={(v) => {
                setHistoryStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={historySort}
              onValueChange={(v: typeof historySort) => setHistorySort(v)}
            >
              <SelectTrigger className="h-8 w-[150px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest first</SelectItem>
                <SelectItem value="date-asc">Oldest first</SelectItem>
                <SelectItem value="net-desc">Highest net</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Payment Date</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">DPS</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedHistory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-10 text-sm text-muted-foreground"
                  >
                    No dividend records found.
                  </TableCell>
                </TableRow>
              ) : (
                pagedHistory.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setDrawer(r)}>
                    <TableCell className="text-xs">{r.payDate}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.symbol}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                        {r.company}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.dps.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.shares.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.gross.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      −{r.tax.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-success">
                      {r.net.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Drawer */}
      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {drawer && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-accent grid place-items-center text-xs font-bold">
                    {drawer.symbol}
                  </div>
                  <div>
                    <SheetTitle className="text-lg">{drawer.symbol}</SheetTitle>
                    <SheetDescription>{drawer.company}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="rounded-xl gradient-mesh border border-primary/20 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Net Dividend
                  </div>
                  <div className="text-2xl font-bold text-gradient tabular-nums">
                    PKR {drawer.net.toLocaleString()}
                  </div>
                  <StatusBadge status={drawer.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <DrawerField label="Dividend / Share" value={drawer.dps.toFixed(2)} />
                  <DrawerField label="Shares Eligible" value={drawer.shares.toLocaleString()} />
                  <DrawerField
                    label="Gross Dividend"
                    value={`PKR ${drawer.gross.toLocaleString()}`}
                  />
                  <DrawerField
                    label="Tax Deducted"
                    value={`− PKR ${drawer.tax.toLocaleString()}`}
                  />
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <DrawerRow label="Ex-Dividend Date" value={drawer.exDate} />
                  <DrawerRow label="Book Closure" value={drawer.bookClosure} />
                  <DrawerRow label="Payment Date" value={drawer.payDate} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ---- Sub components -----------------------------------------------------

function ProjectionCard({
  label,
  amount,
  hint,
  delta,
  tone = "default",
}: {
  label: string;
  amount: number;
  hint: string;
  delta?: number;
  tone?: "default" | "primary";
}) {
  return (
    <Card
      className={cn(
        "card-elevated p-5 hover-lift",
        tone === "primary" && "gradient-mesh border-primary/25",
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-semibold font-display tracking-tight tabular-nums mt-2",
          tone === "primary" && "text-gradient",
        )}
      >
        {pkr(amount)}
      </div>
      <div className="flex items-center gap-2 mt-2">
        {delta !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
            {delta >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta >= 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </Card>
  );
}

function DrawerField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-accent/40 border border-border/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function CalendarGrid({
  month,
  events,
  onSelect,
}: {
  month: Date;
  events: Map<string, { type: "ex" | "book" | "pay"; row: UpcomingRow }[]>;
  onSelect: (r: UpcomingRow) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startDay = first.getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const typeColor: Record<string, string> = {
    ex: "bg-warning",
    book: "bg-primary",
    pay: "bg-success",
  };

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {dayLabels.map((d) => (
          <div
            key={d}
            className="text-[10px] uppercase tracking-wider text-muted-foreground text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="h-16 rounded-md" />;
          const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayEvents = events.get(dateStr) ?? [];
          return (
            <button
              key={i}
              onClick={() => dayEvents[0] && onSelect(dayEvents[0].row)}
              className={cn(
                "h-16 rounded-md border border-border/50 p-1.5 text-left transition-colors",
                dayEvents.length > 0
                  ? "bg-accent/40 hover:bg-accent cursor-pointer"
                  : "hover:bg-muted/40",
              )}
            >
              <div className="text-xs font-medium">{d}</div>
              <div className="flex flex-wrap gap-0.5 mt-1">
                {dayEvents.slice(0, 3).map((e, ei) => (
                  <span
                    key={ei}
                    className={cn("h-1.5 w-1.5 rounded-full", typeColor[e.type])}
                    title={`${e.row.symbol} · ${e.type}`}
                  />
                ))}
              </div>
              {dayEvents[0] && (
                <div className="text-[9px] text-muted-foreground truncate">
                  {dayEvents[0].row.symbol}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
