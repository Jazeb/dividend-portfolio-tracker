import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  CalendarDays,
  Target,
  ArrowUpRight,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
  Trophy,
  AlertTriangle,
  Info,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/stat-card";
import { StockLogo } from "@/components/StockLogo";
import { cn, toISO } from "@/lib/utils";
import {
  portfolios as seedPortfolios,
  holdings as seedHoldings,
  portfolioGrowth,
  sectorAllocation,
  pkr,
  monthLabels,
} from "@/lib/mock-data";
import { portfoliosApi, type PortfolioPerformance } from "@/lib/api/portfolios";
import { buildMockPerformance } from "@/lib/mock/portfolio-performance";
import { toast } from "sonner";
import { Portfolio, Transaction } from "@/types";
import { transactionsApi } from "@/lib/api/transactions";

const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

export const Route = createFileRoute("/_app/portfolio/$id")({
  component: PortfolioDetailPage,
  head: () => ({ meta: [{ title: "Portfolio Details — PSX Dividend Tracker" }] }),
});

const CHART_COLORS = [
  "hsl(160 65% 45%)",
  "hsl(190 70% 45%)",
  "hsl(35 85% 55%)",
  "hsl(280 55% 60%)",
  "hsl(0 70% 60%)",
  "hsl(220 60% 55%)",
];

const TIMEFRAMES = ["1M", "3M", "6M", "1Y", "All"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

function PortfolioDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [tf, setTf] = useState<Timeframe>("6M");
  const [allocMode, setAllocMode] = useState<"current" | "cost">(() => {
    if (typeof window === "undefined") return "current";
    return (window.localStorage.getItem("portfolio-alloc-mode") as "current" | "cost") || "current";
  });

  const seedPortfolio = useMemo(
    () => (seedPortfolios as Portfolio[]).find((p) => String(p.id) === id),
    [id],
  );

  const portfolioQuery = useQuery<Portfolio>({
    queryKey: ["portfolio", id],
    queryFn: () => portfoliosApi.byId(id),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : (seedPortfolio as Portfolio | undefined),
    staleTime: 5 * 60_000,
  });

  const transactionsQuery = useQuery<Transaction[]>({
    queryKey: ["transaction"],
    queryFn: () => transactionsApi.list({ portfolioId: "1" }),
    enabled: API_ENABLED,
    staleTime: 5 * 60_000,
  });

  const portfolio = API_ENABLED ? portfolioQuery.data : seedPortfolio;
  const recentTransactions = transactionsQuery.data;

  const upcomingDividends = portfolio?.upcomingDividend;
  const _monthlyDividends = portfolio?.monthlyDividends;

  // Holdings for this portfolio: prefer backend-provided `portfolio.holdings`,
  // otherwise deterministically partition the seed data for demo mode.
  const portfolioHoldings = useMemo(() => {
    if (!portfolio) return [];
    const seedList = seedPortfolios as Portfolio[];
    const idx = Math.max(
      0,
      seedList.findIndex((p) => String(p.id) === id),
    );
    const raw =
      portfolio.holdings && portfolio.holdings.length > 0
        ? portfolio.holdings.map((h) => ({
            symbol: h.symbol,
            name: h.fullName,
            sector: h.sector,
            qty: Number(h.quantity),
            avgPrice: Number(h.avgPrice),
            currentPrice: h.currentPrice,
            annualDividend: h.annualDividend,
            dividendYield: Number(h.yield).toFixed(2),
            yieldOnCost: h.yoc,
          }))
        : API_ENABLED
          ? []
          : seedHoldings.filter((_, i) => i % Math.max(seedList.length, 1) === idx);

    return raw.map((h) => ({
      ...h,
      marketValue: h.qty * h.currentPrice,
      invested: h.qty * h.avgPrice,
      pl: (h.currentPrice - h.avgPrice) * h.qty,
      plPct: ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100,
    }));
  }, [id, portfolio]);

  // Timeframe slicing of demo series
  const growthSeries = useMemo(() => {
    const map: Record<Timeframe, number> = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      All: portfolioGrowth.length,
    };
    return portfolioGrowth.slice(-map[tf]);
  }, [tf]);

  const mappedMonthlyDividends = (_monthlyDividends ?? []).map((d) => {
    return {
      month: monthLabels[Number(d.month) - 1],
      amount: Number(d.gross),
    };
  });

  const allocations = useMemo(() => {
    const build = (metric: "marketValue" | "invested") => {
      const total = portfolioHoldings.reduce((s, h) => s + (h[metric] ?? 0), 0);
      const bySector = new Map<string, number>();
      portfolioHoldings.forEach((h) =>
        bySector.set(h.sector, (bySector.get(h.sector) ?? 0) + (h[metric] ?? 0)),
      );
      const arr = Array.from(bySector, ([name, value]) => ({
        name,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
      })).sort((a, b) => b.value - a.value);
      return { arr, total };
    };

    const hasData = portfolioHoldings.length > 0;
    const current = hasData
      ? build("marketValue")
      : {
          arr: sectorAllocation.map((s) => ({
            name: s.name,
            value: s.value * 10_000,
            pct: s.value,
          })),
          total: sectorAllocation.reduce((s, x) => s + x.value * 10_000, 0),
        };
    const cost = hasData
      ? build("invested")
      : {
          arr: sectorAllocation.map((s) => ({
            name: s.name,
            value: s.value * 8_000,
            pct: s.value,
          })),
          total: sectorAllocation.reduce((s, x) => s + x.value * 8_000, 0),
        };

    // Stable color assignment across modes: sort sectors alphabetically
    const sectors = Array.from(
      new Set([...current.arr.map((s) => s.name), ...cost.arr.map((s) => s.name)]),
    ).sort();
    const colorMap = new Map<string, string>();
    sectors.forEach((s, i) => colorMap.set(s, CHART_COLORS[i % CHART_COLORS.length]));

    return { current, cost, colorMap };
  }, [portfolioHoldings]);

  const activeAlloc = allocMode === "current" ? allocations.current : allocations.cost;
  const allocation = activeAlloc.arr;

  if (
    API_ENABLED &&
    (portfolioQuery.isLoading || portfolioQuery.isFetching) &&
    !portfolioQuery.data
  ) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading portfolio…
      </div>
    );
  }

  if (API_ENABLED && portfolioQuery.isError) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto mt-16">
        <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">Failed to load portfolio</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {portfolioQuery.error instanceof Error ? portfolioQuery.error.message : "Unknown error"}
        </p>
        <Button size="sm" onClick={() => portfolioQuery.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!portfolio) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto mt-16">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">Portfolio not found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This portfolio may have been deleted or the link is incorrect.
        </p>
        <Button asChild size="sm">
          <Link to="/portfolio">Back to Portfolios</Link>
        </Button>
      </Card>
    );
  }

  const profit = portfolio.portfolioNetworth - portfolio.portfolioCost;
  const returnPct = portfolio.portfolioCost > 0 ? (profit / portfolio.portfolioCost) * 100 : 0;
  const positive = profit >= 0;

  // Derived numbers
  const marketValue =
    portfolioHoldings.reduce((s, h) => s + h.marketValue, 0) || portfolio.portfolioNetworth;

  const costBasis =
    portfolioHoldings.reduce((s, h) => s + h.invested, 0) || portfolio.portfolioCost;

  const unrealized = marketValue - costBasis;
  const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
  const annualDividend = portfolio.annualDividendIncome;

  const upcomingTotal = upcomingDividends?.reduce((s, d) => s + d.total, 0);
  const currentYield = marketValue > 0 ? (annualDividend / marketValue) * 100 : portfolio.yield;
  const yieldOnCost = costBasis > 0 ? (annualDividend / costBasis) * 100 : portfolio.yield * 1.3;

  const topHoldings = [...portfolioHoldings]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, 5);

  const totalMv = portfolioHoldings.reduce((s, h) => s + h.marketValue, 0);

  const bestStock = [...portfolioHoldings].sort((a, b) => b.plPct - a.plPct)[0];
  const worstStock = [...portfolioHoldings].sort((a, b) => a.plPct - b.plPct)[0];

  const handleDelete = async () => {
    try {
      // if (API_ENABLED) await portfoliosApi.remove(portfolio.id);q  1
      toast.success(`"${portfolio.name}" deleted`);
      navigate({ to: "/portfolio" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <>
      {/* Back */}
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground">
          <Link to="/portfolio">
            <ArrowLeft className="h-4 w-4" /> Portfolios
          </Link>
        </Button>
      </div>

      {/* Header */}
      <Card className="card-elevated relative overflow-hidden mb-6 p-6">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 sm:flex sm:items-start sm:justify-between relative">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-14 w-14 shrink-0 rounded-2xl gradient-primary grid place-items-center text-white shadow-glow">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight font-display truncate">
                  {portfolio.name}
                </h1>
                {portfolio.strategy && (
                  <Badge variant="secondary" className="font-normal">
                    {portfolio.strategy}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> Created {toISO(portfolio.createdAt)}
                </span>
                <span>·</span>
                <span>{portfolio.holdingsCount} holdings</span>
              </div>
              {portfolio.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                  {portfolio.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Market Value
              </div>
              <div className="text-2xl font-display font-semibold tabular-nums">
                {pkr(marketValue)}
              </div>
              <div
                className={cn(
                  "text-xs tabular-nums font-medium",
                  positive ? "text-success" : "text-destructive",
                )}
              >
                {positive ? "+" : ""}
                {pkr(profit)} ({positive ? "+" : ""}
                {returnPct.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-5 relative">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => toast.info("Edit portfolio coming soon")}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{portfolio.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All holdings and transaction history associated with
                  this portfolio will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto flex-wrap sm:flex-nowrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ----------- OVERVIEW ------------ */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Portfolio Value"
              value={pkr(marketValue)}
              tone="primary"
              icon={<Wallet className="h-4 w-4" />}
              delta={returnPct}
              deltaLabel="all time"
            />
            <StatCard
              label="Cost Basis"
              value={pkr(costBasis)}
              icon={<BarChart3 className="h-4 w-4" />}
            />
            <StatCard
              label="Unrealized G/L"
              value={pkr(unrealized)}
              icon={
                positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
              }
              delta={unrealizedPct}
            />
            <StatCard
              label="Annual Dividend"
              value={pkr(annualDividend)}
              tone="primary"
              icon={<Coins className="h-4 w-4" />}
              sub={`${currentYield.toFixed(2)}% yield`}
            />
            <StatCard
              label="Upcoming Dividend"
              value={pkr(upcomingTotal ?? 0)}
              icon={<CalendarDays className="h-4 w-4" />}
              sub="next 30 days"
            />
            <StatCard
              label="Current Yield"
              value={`${currentYield.toFixed(2)}%`}
              icon={<PieIcon className="h-4 w-4" />}
            />
            <StatCard
              label="Yield on Cost"
              value={`${yieldOnCost.toFixed(2)}%`}
              tone="primary"
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              label="Holdings"
              value={String(portfolioHoldings.length || portfolio.holdingsCount)}
              icon={<TrendingUp className="h-4 w-4" />}
              sub={`${allocation.length} sectors`}
            />
          </div>

          {/* Performance + Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="card-elevated p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Portfolio Performance</h3>
                  <p className="text-xs text-muted-foreground">Value over time</p>
                </div>
                <div className="flex items-center gap-1 rounded-lg border p-0.5">
                  {TIMEFRAMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTf(t)}
                      className={cn(
                        "px-2.5 py-1 text-xs rounded-md transition",
                        tf === t
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthSeries}>
                    <defs>
                      <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(160 65% 45%)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(160 65% 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(v: number) => pkr(v)}
                      contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(160 65% 45%)"
                      strokeWidth={2}
                      fill="url(#pv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="card-elevated p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold">Allocation</h3>
                    <TooltipProvider delayDuration={100}>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Allocation info"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          <p className="mb-1">
                            <span className="font-semibold">Current Allocation:</span> how your
                            portfolio is distributed based on today's market value.
                          </p>
                          <p>
                            <span className="font-semibold">Cost Allocation:</span> how your
                            original investment was distributed when the positions were purchased.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {allocMode === "current" ? "By current market value" : "By amount invested"}
                  </p>
                </div>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={allocMode}
                  onValueChange={(v) => {
                    if (!v) return;
                    const next = v as "current" | "cost";
                    setAllocMode(next);
                    if (typeof window !== "undefined") {
                      window.localStorage.setItem("portfolio-alloc-mode", next);
                    }
                  }}
                  className="shrink-0"
                  aria-label="Allocation method"
                >
                  <ToggleGroupItem value="current" className="text-xs px-2.5 h-7">
                    Current
                  </ToggleGroupItem>
                  <ToggleGroupItem value="cost" className="text-xs px-2.5 h-7">
                    Cost
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      isAnimationActive
                      animationDuration={500}
                    >
                      {allocation.map((s) => (
                        <Cell
                          key={s.name}
                          fill={allocations.colorMap.get(s.name) ?? CHART_COLORS[0]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _n, p) => [
                        `${pkr(v)} (${(p?.payload?.pct ?? 0).toFixed(1)}%)`,
                        allocMode === "current" ? "Market Value" : "Invested",
                      ]}
                      contentStyle={{ borderRadius: 10, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 mt-2 animate-fade-in" key={allocMode}>
                {allocation.slice(0, 5).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: allocations.colorMap.get(s.name) }}
                      />
                      <span className="truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 tabular-nums">
                      <span className="text-muted-foreground">
                        {pkr(s.value)}
                        {allocMode === "cost" ? " invested" : ""}
                      </span>
                      <span className="font-medium w-12 text-right">{s.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                <div className="min-w-0">
                  <div className="text-muted-foreground">
                    {allocMode === "current" ? "Total Value" : "Total Invested"}
                  </div>
                  <div className="font-semibold tabular-nums truncate">
                    {pkr(activeAlloc.total)}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-muted-foreground">Largest</div>
                  <div className="font-semibold truncate">
                    {allocation[0]?.name ?? "—"}
                    {allocation[0] ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({allocation[0].pct.toFixed(0)}%)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-muted-foreground">Smallest</div>
                  <div className="font-semibold truncate">
                    {allocation[allocation.length - 1]?.name ?? "—"}
                    {allocation.length > 0 ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({allocation[allocation.length - 1].pct.toFixed(0)}%)
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Holdings */}
          <Card className="card-elevated">
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="font-semibold">Top Holdings</h3>
                <p className="text-xs text-muted-foreground">Largest positions in this portfolio</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setTab("holdings")}
              >
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Company</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topHoldings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground py-8"
                      >
                        No holdings yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topHoldings.map((h) => {
                      const weight = totalMv > 0 ? (h.marketValue / totalMv) * 100 : 0;
                      return (
                        <TableRow key={h.symbol}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <StockLogo symbol={h.symbol} size={28} />
                              <div className="min-w-0">
                                <div className="font-medium text-sm">{h.symbol}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {h.name}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {h.qty.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {pkr(h.marketValue)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums",
                              h.pl >= 0 ? "text-success" : "text-destructive",
                            )}
                          >
                            {h.pl >= 0 ? "+" : ""}
                            {pkr(h.pl)}
                            <div className="text-[10px]">
                              {h.pl >= 0 ? "+" : ""}
                              {h.plPct.toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-16">
                                <Progress value={weight} className="h-1.5" />
                              </div>
                              <span className="text-xs tabular-nums w-10 text-right">
                                {weight.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Dividend Summary + Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elevated p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Dividend Summary</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => setTab("dividends")}
                >
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Annual Income", value: pkr(annualDividend) },
                  { label: "Upcoming", value: pkr(upcomingTotal ?? 0) },
                  // { label: "Next Payment", value: upcomingDividends?[0]?.payDate ?? "—" },
                  { label: "Lifetime Received", value: pkr(portfolio.annualDividendIncome * 4) },
                  { label: "Current Yield", value: `${currentYield.toFixed(2)}%` },
                  { label: "Yield on Cost", value: `${yieldOnCost.toFixed(2)}%` },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {row.label}
                    </div>
                    <div className="text-sm font-semibold tabular-nums mt-1">{row.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="card-elevated p-5">
              <h3 className="font-semibold mb-4">Portfolio Goals</h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Annual Dividend Goal",
                    current: annualDividend,
                    target: 500_000,
                    format: pkr,
                  },
                  {
                    label: "Portfolio Value Goal",
                    current: marketValue,
                    target: 5_000_000,
                    format: pkr,
                  },
                  {
                    label: "Monthly Passive Income",
                    current: annualDividend / 12,
                    target: 50_000,
                    format: pkr,
                  },
                ].map((g) => {
                  const pct = Math.min(100, (g.current / g.target) * 100);
                  return (
                    <div key={g.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium">{g.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {g.format(g.current)} / {g.format(g.target)}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                        {pct.toFixed(1)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Recent Transactions + Recent Dividends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elevated">
              <div className="flex items-center justify-between p-5 pb-3">
                <h3 className="font-semibold">Recent Transactions</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => setTab("transactions")}
                >
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions?.slice(0, 5).map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {toISO(t.purchaseDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StockLogo symbol={t.stock.symbol} size={22} />
                            <span className="font-medium text-sm">{t.stock.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {t.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {pkr(t.totalBuyingPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="card-elevated">
              <div className="flex items-center justify-between p-5 pb-3">
                <h3 className="font-semibold">Recent Dividends</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => setTab("dividends")}
                >
                  View All <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Company</TableHead>
                      <TableHead>Pay Date</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingDividends?.slice(0, 5).map((d) => (
                      <TableRow key={d.symbol}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StockLogo symbol={d.symbol} size={22} />
                            <span className="font-medium text-sm">{d.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{d.payDate}</TableCell>
                        <TableCell className="text-right tabular-nums">{pkr(d.total)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {pkr(d.total * 0.85)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            Upcoming
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ----------- HOLDINGS ------------ */}
        <TabsContent value="holdings" className="animate-in fade-in-50">
          <Card className="card-elevated overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-semibold">Holdings</h3>
              <p className="text-xs text-muted-foreground">
                {portfolioHoldings.length} positions in {portfolio.name}
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Stock</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Market Value</TableHead>
                    <TableHead className="text-right">Yield</TableHead>
                    <TableHead className="text-right">P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioHoldings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-sm text-muted-foreground py-10"
                      >
                        No holdings in this portfolio yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    portfolioHoldings.map((h) => (
                      <TableRow key={h.symbol}>
                        <TableCell>
                          <Link
                            to="/stock/$symbol"
                            params={{ symbol: h.symbol }}
                            className="flex items-center gap-3 hover:text-primary"
                          >
                            <StockLogo symbol={h.symbol} size={30} />
                            <div>
                              <div className="font-medium text-sm">{h.symbol}</div>
                              <div className="text-xs text-muted-foreground">{h.name}</div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {h.sector}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.qty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.avgPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{h.currentPrice}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {h.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.dividendYield}%
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums font-medium",
                            h.pl >= 0 ? "text-success" : "text-destructive",
                          )}
                        >
                          {h.pl >= 0 ? "+" : ""}
                          {h.pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          <div className="text-[10px] font-normal">
                            {h.pl >= 0 ? "+" : ""}
                            {h.plPct.toFixed(1)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ----------- TRANSACTIONS ------------ */}
        <TabsContent value="transactions" className="animate-in fade-in-50">
          <Card className="card-elevated overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Transactions</h3>
                <p className="text-xs text-muted-foreground">Activity in {portfolio.name}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/transactions">
                  Manage <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions?.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{t.purchaseDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockLogo symbol={t.stock.symbol} size={22} />
                          <span className="font-medium text-sm">{t.stock.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {t.transactionType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(t.purchaseDate).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {pkr(t.totalBuyingPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ----------- DIVIDENDS ------------ */}
        {/* <TabsContent value="dividends" className="space-y-4 animate-in fade-in-50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Annual Income"
              value={pkr(annualDividend)}
              tone="primary"
              icon={<Coins className="h-4 w-4" />}
            />
            <StatCard
              label="Upcoming"
              value={pkr(upcomingTotal ?? 0)}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <StatCard
              label="Current Yield"
              value={`${currentYield.toFixed(2)}%`}
              icon={<PieIcon className="h-4 w-4" />}
            />
            <StatCard
              label="Yield on Cost"
              value={`${yieldOnCost.toFixed(2)}%`}
              tone="primary"
              icon={<Target className="h-4 w-4" />}
            />
          </div>

          <Card className="card-elevated p-5">
            <h3 className="font-semibold mb-4">Upcoming Dividends</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Company</TableHead>
                    <TableHead>Ex Date</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Est. Total</TableHead>
                    <TableHead className="text-right">After Tax</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingDividends?.map((d) => (
                    <TableRow key={d.symbol}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockLogo symbol={d.symbol} size={22} />
                          <div>
                            <div className="font-medium text-sm">{d.symbol}</div>
                            <div className="text-xs text-muted-foreground">{d.company}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{d.exDate}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{d.payDate}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.amount}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {pkr(d.total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {pkr(d.afterTax)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{d.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="card-elevated p-5">
            <h3 className="font-semibold mb-4">Monthly Dividend Income</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mappedMonthlyDividends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(v: number) => pkr(v)}
                    contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill="hsl(160 65% 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent> */}

        {/* ----------- PERFORMANCE ------------ */}
        <TabsContent value="performance" className="space-y-6 animate-in fade-in-50">
          <PerformanceTab
            portfolioId={portfolio.id}
            fallback={{
              marketValue,
              costBasis,
              annualDividend,
              holdings: portfolioHoldings.map((h) => ({
                symbol: h.symbol,
                qty: h.qty,
                avgPrice: h.avgPrice,
                currentPrice: h.currentPrice,
                annualDividend: h.annualDividend,
              })),
            }}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

// ============================================================
// PERFORMANCE TAB
// ============================================================

interface PerformanceFallback {
  marketValue: number;
  costBasis: number;
  annualDividend: number;
  holdings: {
    symbol: string;
    qty: number;
    avgPrice: number;
    currentPrice: number;
    annualDividend: number;
  }[];
}

function PerformanceTab({
  portfolioId,
  fallback,
}: {
  portfolioId: number | string;
  fallback: PerformanceFallback;
}) {
  const mock = useMemo<PortfolioPerformance>(() => buildMockPerformance(fallback), [fallback]);

  const perfQuery = useQuery<PortfolioPerformance>({
    queryKey: ["portfolio-performance", portfolioId],
    queryFn: () => portfoliosApi.performance(portfolioId),
    enabled: API_ENABLED,
    staleTime: 60_000,
  });

  if (API_ENABLED && perfQuery.isLoading && !perfQuery.data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading performance…
      </div>
    );
  }

  if (API_ENABLED && perfQuery.isError && !perfQuery.data) {
    return (
      <Card className="p-6 text-center">
        <div className="text-sm text-destructive mb-3">Could not load performance metrics.</div>
        <Button variant="outline" size="sm" onClick={() => perfQuery.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const data: PortfolioPerformance = API_ENABLED ? (perfQuery.data ?? mock) : mock;
  const {
    dividend,
    capital,
    portfolioGrowth: growth,
    annualDividendGrowth,
    monthlyDividendIncome,
    incomeByStock,
    insights,
    health,
  } = data;

  const unrealizedPct =
    capital.marketValue - capital.unrealizedGain > 0
      ? (capital.unrealizedGain / (capital.marketValue - capital.unrealizedGain)) * 100
      : 0;

  const targetPct =
    health.dividendTarget > 0
      ? Math.min(100, (health.currentDividend / health.dividendTarget) * 100)
      : 0;

  const maxIncome = Math.max(...incomeByStock.map((s) => s.income), 1);
  const maxAnnual = Math.max(...annualDividendGrowth.map((y) => y.income), 1);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* SECTION 1 — Dividend Performance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Dividend Performance
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Annual Dividend Income"
            value={pkr(dividend.annualIncome)}
            tone="primary"
            icon={<Coins className="h-4 w-4" />}
            sub="projected"
            delta={dividend.growth}
            deltaLabel="vs last year"
          />
          <StatCard
            label="Yield on Cost"
            value={`${dividend.yieldOnCost.toFixed(2)}%`}
            tone="primary"
            icon={<Target className="h-4 w-4" />}
            sub="on invested"
          />
          <StatCard
            label="Current Dividend Yield"
            value={`${dividend.currentYield.toFixed(2)}%`}
            icon={<PieIcon className="h-4 w-4" />}
            sub="on market value"
          />
          <StatCard
            label="Dividend Growth"
            value={`+${dividend.growth.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            sub="vs previous year"
          />
        </div>
      </div>

      {/* SECTION 2 — Capital Performance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Capital Performance
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Market Value"
            value={pkr(capital.marketValue)}
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatCard
            label="Unrealized Gain"
            value={`${capital.unrealizedGain >= 0 ? "+" : ""}${pkr(capital.unrealizedGain)}`}
            icon={
              capital.unrealizedGain >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )
            }
            delta={unrealizedPct}
          />
          <StatCard
            label="Realized Gain"
            value={pkr(capital.realizedGain)}
            icon={<Coins className="h-4 w-4" />}
          />
          <StatCard
            label="Total Return"
            value={pkr(capital.totalReturn)}
            tone="primary"
            icon={<Trophy className="h-4 w-4" />}
            sub="gain + dividends"
          />
        </div>
      </div>

      {/* SECTION 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-elevated p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Portfolio Growth</h3>
            <p className="text-xs text-muted-foreground">Market value vs. cost basis</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, name: string) => [pkr(v), name]}
                  labelFormatter={(label, payload) => {
                    const p = payload?.[0]?.payload as
                      { cost: number; marketValue: number } | undefined;
                    const gain = p ? p.marketValue - p.cost : 0;
                    return `${label} · Gain ${gain >= 0 ? "+" : ""}${pkr(gain)}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="marketValue"
                  name="Market Value"
                  stroke="hsl(160 65% 45%)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Cost Basis"
                  stroke="hsl(220 15% 55%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-elevated p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Dividend Income Growth</h3>
            <p className="text-xs text-muted-foreground">Annual dividend income</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={annualDividendGrowth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="year" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number, _n, item) => {
                    const idx = annualDividendGrowth.findIndex((y) => y.year === item.payload.year);
                    const prev = idx > 0 ? annualDividendGrowth[idx - 1].income : 0;
                    const growthPct = prev > 0 ? ((v - prev) / prev) * 100 : 0;
                    return [
                      `${pkr(v)}${item.payload.projected ? " (projected)" : ""}`,
                      `Growth ${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
                    ];
                  }}
                />
                <Bar dataKey="income" radius={[8, 8, 0, 0]}>
                  {annualDividendGrowth.map((y) => (
                    <Cell
                      key={y.year}
                      fill={y.projected ? "hsl(160 55% 65%)" : "hsl(160 65% 45%)"}
                      fillOpacity={y.projected ? 0.7 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[hsl(160_65%_45%)]" /> Realized
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[hsl(160_55%_65%)] opacity-70" /> Projected
            </span>
          </div>
        </Card>
      </div>

      {/* SECTION 4 — Dividend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="card-elevated p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Monthly Dividend Income</h3>
            <p className="text-xs text-muted-foreground">Projected income by month</p>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyDividendIncome}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => [pkr(v), "Income"]}
                />
                <Bar dataKey="income" fill="hsl(160 65% 45%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="card-elevated p-5">
          <div className="mb-4">
            <h3 className="font-semibold">Income by Stock</h3>
            <p className="text-xs text-muted-foreground">Annual dividend contribution</p>
          </div>
          <div className="space-y-3">
            {incomeByStock.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                No income data yet.
              </div>
            )}
            {incomeByStock.slice(0, 8).map((s) => {
              const barPct = (s.income / maxIncome) * 100;
              console.log({ s });
              return (
                <div key={s.symbol} className="flex items-center gap-3">
                  {/* <StockLogo symbol={s.symbol} size={28} /> */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm font-semibold">{s.symbol}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {pkr(s.income)} · {s.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-accent/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* SECTION 5 — Insights */}
      <Card className="card-elevated p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Performance Insights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <InsightTile
            label="Highest Dividend Contributor"
            symbol={insights.highestContributor}
            detail={(() => {
              const s = incomeByStock.find((x) => x.symbol === insights.highestContributor);
              return s ? `${pkr(s.income)}/year` : "—";
            })()}
          />
          <InsightTile
            label="Highest Yield on Cost"
            symbol={insights.highestYieldOnCost}
            detail={`${dividend.yieldOnCost.toFixed(1)}%`}
          />
          <InsightTile
            label="Largest Capital Gain"
            symbol={insights.largestCapitalGain}
            detail={`+${pkr(Math.max(capital.unrealizedGain, 0))}`}
            positive
          />
          <InsightTile
            label="Largest Position"
            symbol={insights.largestPosition}
            detail={(() => {
              const s = incomeByStock.find((x) => x.symbol === insights.largestPosition);
              return s ? `${s.percentage.toFixed(1)}%` : "—";
            })()}
          />
        </div>
      </Card>

      {/* SECTION 6 — Portfolio Health */}
      <Card className="card-elevated p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Portfolio Health</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Dividend Target
              </span>
              <span className="text-xs font-semibold tabular-nums">{targetPct.toFixed(0)}%</span>
            </div>
            <div className="text-lg font-display font-semibold tabular-nums">
              {pkr(health.currentDividend)}{" "}
              <span className="text-sm text-muted-foreground font-normal">
                / {pkr(health.dividendTarget)}
              </span>
            </div>
            <Progress value={targetPct} className="h-2 mt-3" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Diversification
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-success">
                {health.diversificationScore}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Set(fallback.holdings.map((h) => h.symbol)).size} holdings
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Average Holding Period
            </div>
            <div className="text-2xl font-display font-semibold tabular-nums">
              {health.holdingPeriodYears.toFixed(1)}
              <span className="text-sm text-muted-foreground font-normal ml-1">years</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InsightTile({
  label,
  symbol,
  detail,
  positive,
}: {
  label: string;
  symbol: string;
  detail: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-accent/30 p-4 flex items-center gap-3 hover-lift">
      {/* <StockLogo symbol={symbol} size={40} /> */}
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
          {label}
        </div>
        <div className="font-semibold">{symbol}</div>
        <div
          className={cn(
            "text-xs tabular-nums",
            positive ? "text-success" : "text-muted-foreground",
          )}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}
