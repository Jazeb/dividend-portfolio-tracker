import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Clock,
  TrendingUp,
  Wallet,
  Percent,
  Target,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
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
} from "recharts";
import { portfolios as seedPortfolios, pkr, monthLabels } from "@/lib/mock-data";
import { dividendsApi, type DividendDashboard, type DividendItem } from "@/lib/api/dividends";
import { portfoliosApi } from "@/lib/api/portfolios";
import { buildMockDividendDashboard } from "@/lib/mock/dividend-dashbord";
import { cn } from "@/lib/utils";

import { Portfolio } from "@/types";

// const API_ENABLED = false;
const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

export const Route = createFileRoute("/_app/dividends")({
  component: DividendsPage,
  head: () => ({
    meta: [
      { title: "Dividends — PSX Dividend Tracker" },
      {
        name: "description",
        content:
          "Track dividend income, upcoming payments, history, projections, and growth for the selected portfolio.",
      },
    ],
  }),
});

const chartColors = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#ec4899",
  "#64748b",
];

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

type HistoryRow = {
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

function toDisplayStatus(s: DividendItem["status"]): UpcomingRow["status"] | "Paid" {
  if (s === "PAID") return "Paid";
  if (s === "PROCESSING") return "Processing";
  return "Upcoming";
}

function mapUpcoming(items: DividendItem[]): UpcomingRow[] {
  return items.map((u) => {
    const pay = new Date(u.paymentDate);
    const ex = new Date(pay);
    ex.setDate(ex.getDate() - 15);
    const book = new Date(pay);
    book.setDate(book.getDate() - 10);
    const d = {
      id: u.id,
      symbol: u.stock,
      company: u.company,
      dps: u.dividendPerShare,
      shares: u.eligibleShares,
      gross: u.grossDividend,
      tax: u.taxAmount,
      net: u.netDividend,
      exDate: ex.toISOString().slice(0, 10),
      bookClosure: book.toISOString().slice(0, 10),
      payDate: u.paymentDate,
      status: (toDisplayStatus(u.status) as UpcomingRow["status"]) ?? "Upcoming",
    };
    return d;
  });
}

function mapHistory(items: DividendItem[]): HistoryRow[] {
  return items.map((u) => {
    const pay = new Date(u.paymentDate);
    const ex = new Date(pay);
    ex.setDate(ex.getDate() - 15);
    const book = new Date(pay);
    book.setDate(book.getDate() - 10);
    return {
      id: u.id,
      symbol: u.stock,
      company: u.company,
      dps: u.dividendPerShare,
      shares: u.eligibleShares,
      gross: u.grossDividend,
      tax: u.taxAmount,
      net: u.netDividend,
      exDate: ex.toISOString().slice(0, 10),
      bookClosure: book.toISOString().slice(0, 10),
      payDate: u.paymentDate,
      status: "Paid",
    };
  });
}

// ---- Component ---------------------------------------------------------
function DividendsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<string>("all");
  const [historySort, setHistorySort] = useState<"date-desc" | "date-asc" | "net-desc">(
    "date-desc",
  );
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [drawer, setDrawer] = useState<UpcomingRow | HistoryRow | null>(null);
  const [calMonth, setCalMonth] = useState(new Date(2026, 6, 1));
  const [upcomingSort, setUpcomingSort] = useState<"payDate" | "net">("payDate");

  // --- Portfolios ---
  const portfoliosQuery = useQuery<Portfolio[]>({
    queryKey: ["portfolios"],
    queryFn: () => portfoliosApi.list(),
    enabled: API_ENABLED,
    // initialData: API_ENABLED ? undefined : (seedPortfolios as Portfolio[]),
    // placeholderData: seedPortfolios as Portfolio[],
    retry: 1,
    staleTime: 5 * 60_000,
  });

  const portfolios: Portfolio[] = portfoliosQuery.data ?? (seedPortfolios as Portfolio[]);

  // Auto-select first portfolio once available.
  useEffect(() => {
    if (!selectedId && portfolios.length > 0) {
      setSelectedId(portfolios[0].id);
    }
  }, [selectedId, portfolios]);

  // --- Dashboard (per portfolio, cached) ---
  const dashboardQuery = useQuery<DividendDashboard>({
    queryKey: ["dividends", "dashboard", selectedId],
    queryFn: () => {
      if (!selectedId) throw new Error("No portfolio selected");
      return dividendsApi.dashboard(selectedId);
    },
    enabled: !!selectedId,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // --- Dashboard (per portfolio, cached) ---
  // const upcomingQuery = useQuery<DividendDashboard>({
  //   queryKey: ["dividends", selectedId],
  //   queryFn: () => {
  //     if (!selectedId) throw new Error("No portfolio selected");
  //     return API_ENABLED
  //       ? dividendsApi.upcoming(selectedId)
  //       : Promise.resolve(buildMockDividendDashboard(selectedId));
  //   },
  //   enabled: !!selectedId,
  //   staleTime: 5 * 60_000,
  //   retry: 1,
  // });

  // Reset paging when switching portfolios.
  useEffect(() => {
    setPage(1);
    setHistorySearch("");
    setHistoryStatus("all");
  }, [selectedId]);

  const activePortfolio = portfolios.find((p) => p.id === selectedId);
  const isLoading = dashboardQuery.isLoading || dashboardQuery.isFetching;
  const isError = dashboardQuery.isError;

  const dashboard = dashboardQuery.data;

  const upcomingRows = useMemo(
    () => (dashboard ? mapUpcoming(dashboard.upcoming) : []),
    [dashboard],
  );
  console.log("upcomingRows");
  console.log(upcomingRows);
  const historyRows = useMemo(() => (dashboard ? mapHistory(dashboard.history) : []), [dashboard]);

  const filteredUpcoming = useMemo(() => {
    return [...upcomingRows].sort((a, b) => {
      if (upcomingSort === "net") return b.net - a.net;
      return a.payDate < b.payDate ? -1 : 1;
    });
  }, [upcomingRows, upcomingSort]);

  const filteredHistory = useMemo(() => {
    let rows = historyRows;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      rows = rows.filter(
        (r) => r.symbol.toLowerCase().includes(q) || r.company.toLowerCase().includes(q),
      );
    }
    if (historyStatus !== "all") rows = rows.filter((r) => r.status === historyStatus);
    return [...rows].sort((a, b) => {
      if (historySort === "net-desc") return b.net - a.net;
      if (historySort === "date-asc") return a.payDate < b.payDate ? -1 : 1;
      return a.payDate < b.payDate ? 1 : -1;
    });
  }, [historyRows, historySearch, historyStatus, historySort]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const pagedHistory = filteredHistory.slice((page - 1) * pageSize, page * pageSize);

  const sectorPie = useMemo(() => {
    if (!dashboard) return [] as { name: string; value: number }[];
    const total = dashboard.breakdownBySector.reduce((s, x) => s + x.annualIncome, 0) || 1;
    return dashboard.breakdownBySector.map((s) => ({
      name: s.sector,
      value: Math.round((s.annualIncome / total) * 100),
    }));
  }, [dashboard]);

  const calendarEvents = useMemo(() => {
    const map = new Map<string, { type: "ex" | "book" | "pay"; row: UpcomingRow }[]>();
    filteredUpcoming.forEach((r) => {
      const push = (date: string, type: "ex" | "book" | "pay") => {
        const arr = map.get(date) ?? [];
        arr.push({ type, row: r });
        map.set(date, arr);
      };
      push(r.exDate, "ex");
      push(r.bookClosure, "book");
      push(r.payDate, "pay");
    });
    return map;
  }, [filteredUpcoming]);

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
    a.download = `dividend-history-${activePortfolio?.name ?? "portfolio"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PortfolioSelector = (
    <Select
      value={selectedId ?? undefined}
      onValueChange={setSelectedId}
      disabled={isLoading && !dashboard}
    >
      <SelectTrigger className="h-9 w-[240px]">
        <SelectValue placeholder="Select portfolio" />
      </SelectTrigger>
      <SelectContent>
        {portfolios.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const header = (
    <PageHeader
      title="Dividends"
      description="Track income, upcoming payments, history & projections"
      actions={PortfolioSelector}
    />
  );

  // --- Error state ---
  if (isError && !dashboard) {
    return (
      <>
        {header}
        <Card className="card-elevated p-10 text-center flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 grid place-items-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Couldn't load dividend data</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {(dashboardQuery.error as Error)?.message ??
                "Something went wrong fetching the dashboard."}
            </p>
          </div>
          <Button className="gap-2" onClick={() => dashboardQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </Card>
      </>
    );
  }

  // --- Loading state ---
  if (isLoading && !dashboard) {
    return (
      <>
        {header}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </>
    );
  }

  if (!dashboard) {
    return <>{header}</>;
  }

  const { summary } = dashboard;
  // const isEmpty =
  //   dashboard.breakdownByStock.length === 0 &&
  //   dashboard.history.length === 0 &&
  //   dashboard.upcoming.length === 0;

  // if (isEmpty) {
  //   return (
  //     <>
  //       {header}
  //       <Card className="card-elevated p-12 text-center flex flex-col items-center gap-4">
  //         <div className="h-14 w-14 rounded-2xl gradient-primary grid place-items-center">
  //           <Coins className="h-7 w-7 text-primary-foreground" />
  //         </div>
  //         <div>
  //           <h2 className="text-lg font-semibold">
  //             No dividend data available for this portfolio.
  //           </h2>
  //           <p className="text-sm text-muted-foreground mt-1">
  //             Add transactions to start tracking dividend payments.
  //           </p>
  //         </div>
  //         <Button className="gap-2">
  //           <Sparkles className="h-4 w-4" />
  //           Add Transactions
  //         </Button>
  //       </Card>
  //     </>
  //   );
  // }

  const nextMonth = Math.round(summary.annualIncome / 12);
  const nextQuarter = Math.round(summary.annualIncome / 4);
  const nextYearProjected = Math.round(summary.annualIncome * 1.12);

  return (
    <>
      {header}
      {activePortfolio && (
        <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            Showing dividends for{" "}
            <span className="font-medium text-foreground">{activePortfolio.name}</span>
          </span>
          {dashboardQuery.isFetching && (
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing…
            </span>
          )}
        </div>
      )}

      <div
        className={cn("transition-opacity duration-200", dashboardQuery.isFetching && "opacity-60")}
      >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard
            label="Annual Income"
            value={pkr(summary?.annualIncome || 0)}
            icon={<Coins className="h-4 w-4" />}
            tone="primary"
          />
          <StatCard
            label="Monthly Avg"
            value={pkr(summary.monthlyIncome || 0)}
            icon={<CalendarDays className="h-4 w-4" />}
          />
          <StatCard
            label="Upcoming"
            value={pkr(summary.upcomingDividend || 0)}
            sub={`${filteredUpcoming.length} events`}
            icon={<Clock className="h-4 w-4" />}
          />
          <StatCard
            label="Lifetime Income"
            value={pkr(summary.lifetimeIncome || 0)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatCard
            label="Yield"
            value={`${summary?.yield?.toFixed(2)}%`}
            sub="portfolio"
            icon={<Percent className="h-4 w-4" />}
          />
          <StatCard
            label="Yield on Cost"
            value={`${summary?.yieldOnCost?.toFixed(2)}%`}
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
            <Select
              value={upcomingSort}
              onValueChange={(v: "payDate" | "net") => setUpcomingSort(v)}
            >
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
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead>Ex-Date</TableHead>
                  <TableHead>Book Closure</TableHead>
                  <TableHead>Pay Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpcoming.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      No upcoming dividends.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUpcoming.map((r) => (
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
                      <TableCell className="text-xs text-muted-foreground">
                        {r.bookClosure}
                      </TableCell>
                      <TableCell className="text-xs">{r.payDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                    data={sectorPie}
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {sectorPie.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {sectorPie.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: chartColors[i % chartColors.length] }}
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

        {/* Income Trend + Sector Income */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="card-elevated lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Dividend Income Trend</CardTitle>
              <CardDescription>Monthly income across the year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dashboard.incomeTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                  <Line
                    type="monotone"
                    dataKey="income"
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
              <CardTitle className="text-base">Income by Sector</CardTitle>
              <CardDescription>Annual (PKR)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dashboard.breakdownBySector}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="sector" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs"
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                  <Bar dataKey="annualIncome" fill="#3b82f6" radius={[8, 8, 0, 0]} />
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
          <ProjectionCard
            label="Next Quarter"
            amount={nextQuarter}
            hint="Assumes no new purchases"
          />
          <ProjectionCard
            label="Next Year (Projected)"
            amount={nextYearProjected}
            hint="+12% growth assumption"
          />
        </div>

        {/* Breakdown by Stock */}
        <Card className="card-elevated mb-6">
          <CardHeader>
            <CardTitle className="text-base">Breakdown by Stock</CardTitle>
            <CardDescription>Annual contribution, yield & YoC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.breakdownByStock.map((h) => (
              <div key={h.symbol} className="grid grid-cols-[110px_1fr_auto] gap-3 items-center">
                <div>
                  <div className="text-sm font-semibold">{h.symbol}</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {h.company}
                  </div>
                </div>
                <div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full"
                      style={{ width: `${Math.min(Number(h.contribution), 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    <span>Yield {h.yield}%</span>
                    <span className="text-primary">YoC {h.yieldOnCost}%</span>
                  </div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-sm font-semibold">{pkr(h.annualIncome)}</div>
                  <Badge variant="secondary" className="text-[10px]">
                    {Number(h.contribution).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* History */}
        <Card className="card-elevated">
          <CardHeader className="flex-row items-center justify-between space-y-0 flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Dividend History</CardTitle>
              <CardDescription>
                {filteredHistory.length} payment
                {filteredHistory.length !== 1 && "s"}
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
      </div>

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
  tone = "default",
}: {
  label: string;
  amount: number;
  hint: string;
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
