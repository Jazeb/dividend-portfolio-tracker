import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar,
} from "recharts";
import {
  ArrowLeft, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Coins,
  CalendarDays, Target, ArrowUpRight, Loader2, PieChart as PieIcon,
  BarChart3, Trophy, AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/stat-card";
import { StockLogo } from "@/components/StockLogo";
import { cn } from "@/lib/utils";
import {
  seedPortfolios,
  holdings as seedHoldings,
  portfolioGrowth,
  sectorAllocation,
  monthlyDividends,
  upcomingDividends,
  recentTransactions,
  pkr,
} from "@/lib/mock-data";
import { portfoliosApi } from "@/lib/api/portfolios";
import { toast } from "sonner";
import { Portfolio } from "@/types";

const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

export const Route = createFileRoute("/_app/portfolio/$id")({
  component: PortfolioDetailPage,
  head: () => ({ meta: [{ title: "Portfolio Details — PSX Dividend Tracker" }] }),
});

const CHART_COLORS = [
  "hsl(160 65% 45%)", "hsl(190 70% 45%)", "hsl(35 85% 55%)",
  "hsl(280 55% 60%)", "hsl(0 70% 60%)", "hsl(220 60% 55%)",
];

const TIMEFRAMES = ["1M", "3M", "6M", "1Y", "All"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

function PortfolioDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [tf, setTf] = useState<Timeframe>("6M");

  const portfolioQuery = useQuery<Portfolio>({
    queryKey: ["portfolios"],
    queryFn: () => portfoliosApi.byId(String(id)),
    enabled: API_ENABLED,
    // initialData: API_ENABLED ? undefined : (seedPortfolios as Portfolio[]),
    // placeholderData: seedPortfolios as Portfolio[],
    staleTime: 5 * 60_000,
  });

  const portfolio: Portfolio | undefined = portfolioQuery.data

  const portfolioHoldings = useMemo(() => {
    const holdings = portfolio?.holdings;
    return holdings?.map(h => {
      const avgPrice = Number(h.avgPrice);
      const quantity = Number(h.quantity);
      return {
        ...h,
          marketValue: quantity * h.currentPrice, //h.qty * h.currentPrice,
          invested: quantity * avgPrice,
          pl: (h.currentPrice - avgPrice) * quantity,
          plPct: ((h.currentPrice - avgPrice) / avgPrice) * 100,
      }
    })
    // const idx = Math.max(0, portfolios.findIndex((p) => p.id === id));
    // return seedHoldings
    //   .filter((_, i) => i % Math.max(portfolios.length, 1) === idx)
    //   .map((h) => ({
    //     ...h,
    //     marketValue: h.qty * h.currentPrice,
    //     invested: h.qty * h.avgPrice,
    //     pl: (h.currentPrice - h.avgPrice) * h.qty,
    //     plPct: ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100,
    //   }));
  }, [id, portfolio]);

  if (portfolioQuery.isLoading && !portfolio) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading portfolio…
      </div>
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

  const profit = portfolio.portfolioProfit; // portfolio.value - portfolio.cost;
  const returnPct = portfolio.profitPercent; // portfolio.cost > 0 ? (profit / portfolio.cost) * 100 : 0;
  const positive = profit >= 0;

  // Derived numbers (demo)
  const marketValue = portfolio.portfolioNetworth; // portfolioHoldings.reduce((s, h) => s + h.marketValue, 0) || portfolio.value;
  const costBasis = portfolio.portfolioCost; //portfolioHoldings.reduce((s, h) => s + h.invested, 0) || portfolio.cost;
  const unrealized = marketValue - costBasis;
  const unrealizedPct = costBasis > 0 ? (unrealized / costBasis) * 100 : 0;
  const annualDividend = portfolio.annualDividendIncome; //portfolioHoldings.reduce((s, h) => s + h.qty * h.annualDividend, 0) || portfolio.dividendIncome;
  const upcomingTotal =  upcomingDividends.reduce((s, d) => s + d.total, 0);
  const currentYield = portfolio.yield; // marketValue > 0 ? (annualDividend / marketValue) * 100 : portfolio.yield;
  const yieldOnCost = costBasis > 0 ? (annualDividend / costBasis) * 100 : portfolio.yield * 1.3;

  // Timeframe slicing of demo series
  const growthSeries = useMemo(() => {
    const map: Record<Timeframe, number> = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "All": portfolioGrowth.length };
    return portfolioGrowth.slice(-map[tf]);
  }, [tf]);

  const allocation = useMemo(() => {
    const total = portfolioHoldings?.reduce((s, h) => s + h.marketValue, 0);
    const bySector = new Map<string, number>();
    portfolioHoldings?.forEach((h) => bySector.set(h.sector, (bySector.get(h.sector) ?? 0) + h.marketValue));
    const arr = Array.from(bySector, ([name, value]) => ({
      name,
      value,
      pct: total && total > 0 ? (value / total) * 100 : 0,
    }));
    return arr.length ? arr.sort((a, b) => b.value - a.value) : sectorAllocation.map((s) => ({ name: s.name, value: s.value * 10_000, pct: s.value }));
  }, [portfolioHoldings]);

  const topHoldings = [...portfolioHoldings || []].sort((a, b) => b.marketValue - a.marketValue).slice(0, 5);
  const totalMv = (portfolioHoldings || []).reduce((s, h) => s + h.marketValue, 0);

  const bestStock = [...portfolioHoldings || []].sort((a, b) => b.plPct - a.plPct)[0];
  const worstStock = [...portfolioHoldings || []].sort((a, b) => a.plPct - b.plPct)[0];

  const handleDelete = async () => {
    try {
      if (API_ENABLED) await portfoliosApi.remove(String(portfolio.id));
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
          <Link to="/portfolio"><ArrowLeft className="h-4 w-4" /> Portfolios</Link>
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
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight font-display truncate">{portfolio.name}</h1>
                {portfolio.strategy && (
                  <Badge variant="secondary" className="font-normal">{portfolio.strategy}</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Created Jan 2025</span>
                <span>·</span>
                {/* <span>{portfolio?.holdings} holdings</span> */}
              </div>
              {portfolio.description && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{portfolio.description}</p>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Market Value</div>
              <div className="text-2xl font-display font-semibold tabular-nums">{pkr(marketValue)}</div>
              <div className={cn("text-xs tabular-nums font-medium", positive ? "text-success" : "text-destructive")}>
                {positive ? "+" : ""}{pkr(profit)} ({positive ? "+" : ""}{returnPct.toFixed(2)}%)
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-5 relative">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Edit portfolio coming soon")}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{portfolio.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All holdings and transaction history associated with this portfolio will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            <StatCard label="Portfolio Value" value={pkr(marketValue)} tone="primary" icon={<Wallet className="h-4 w-4" />} delta={returnPct} deltaLabel="all time" />
            <StatCard label="Cost Basis" value={pkr(costBasis)} icon={<BarChart3 className="h-4 w-4" />} />
            <StatCard label="Unrealized G/L" value={pkr(unrealized)} icon={positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} delta={unrealizedPct} />
            <StatCard label="Annual Dividend" value={pkr(annualDividend)} tone="primary" icon={<Coins className="h-4 w-4" />} sub={`${currentYield.toFixed(2)}% yield`} />
            <StatCard label="Upcoming Dividend" value={pkr(upcomingTotal)} icon={<CalendarDays className="h-4 w-4" />} sub="next 30 days" />
            <StatCard label="Current Yield" value={`${currentYield.toFixed(2)}%`} icon={<PieIcon className="h-4 w-4" />} />
            <StatCard label="Yield on Cost" value={`${yieldOnCost.toFixed(2)}%`} tone="primary" icon={<Target className="h-4 w-4" />} />
            <StatCard label="Holdings" value={String(portfolio.holdings?.length || portfolio.holdings)} icon={<TrendingUp className="h-4 w-4" />} sub={`${allocation.length} sectors`} />
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
                        tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
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
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => pkr(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(160 65% 45%)" strokeWidth={2} fill="url(#pv)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="card-elevated p-5">
              <h3 className="font-semibold mb-1">Asset Allocation</h3>
              <p className="text-xs text-muted-foreground mb-3">By sector</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {allocation.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => pkr(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {allocation.slice(0, 5).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate">{s.name}</span>
                    </div>
                    <div className="tabular-nums text-muted-foreground">
                      {s.pct.toFixed(1)}%
                    </div>
                  </div>
                ))}
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
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => setTab("holdings")}>
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
                    <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No holdings yet.</TableCell></TableRow>
                  ) : topHoldings.map((h) => {
                    const weight = totalMv > 0 ? (h.marketValue / totalMv) * 100 : 0;
                    return (
                      <TableRow key={h.symbol}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <StockLogo symbol={h.symbol} size={28} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm">{h.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">{h.fullName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{h.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{pkr(h.marketValue)}</TableCell>
                        <TableCell className={cn("text-right tabular-nums", h.pl >= 0 ? "text-success" : "text-destructive")}>
                          {h.pl >= 0 ? "+" : ""}{pkr(h.pl)}
                          <div className="text-[10px]">{h.pl >= 0 ? "+" : ""}{h.plPct.toFixed(1)}%</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16"><Progress value={weight} className="h-1.5" /></div>
                            <span className="text-xs tabular-nums w-10 text-right">{weight.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Dividend Summary + Goals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="card-elevated p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Dividend Summary</h3>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setTab("dividends")}>View All <ArrowUpRight className="h-3 w-3" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Annual Income", value: pkr(annualDividend) },
                  { label: "Upcoming", value: pkr(upcomingTotal) },
                  { label: "Next Payment", value: upcomingDividends[0]?.payDate ?? "—" },
                  { label: "Lifetime Received", value: pkr(portfolio.annualDividendIncome * 4) },
                  { label: "Current Yield", value: `${currentYield.toFixed(2)}%` },
                  { label: "Yield on Cost", value: `${yieldOnCost.toFixed(2)}%` },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg border p-3">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{row.label}</div>
                    <div className="text-sm font-semibold tabular-nums mt-1">{row.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="card-elevated p-5">
              <h3 className="font-semibold mb-4">Portfolio Goals</h3>
              <div className="space-y-4">
                {[
                  { label: "Annual Dividend Goal", current: annualDividend, target: 500_000, format: pkr },
                  { label: "Portfolio Value Goal", current: marketValue, target: 5_000_000, format: pkr },
                  { label: "Monthly Passive Income", current: annualDividend / 12, target: 50_000, format: pkr },
                ].map((g) => {
                  const pct = Math.min(100, (g.current / g.target) * 100);
                  return (
                    <div key={g.label}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium">{g.label}</span>
                        <span className="text-muted-foreground tabular-nums">{g.format(g.current)} / {g.format(g.target)}</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                      <div className="text-[10px] text-muted-foreground mt-1 tabular-nums">{pct.toFixed(1)}% complete</div>
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
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setTab("transactions")}>View All <ArrowUpRight className="h-3 w-3" /></Button>
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
                    {recentTransactions.slice(0, 5).map((t, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-nowrap">{t.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StockLogo symbol={t.symbol} size={22} />
                            <span className="font-medium text-sm">{t.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="font-normal">{t.type}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{t.qty}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{pkr(t.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="card-elevated">
              <div className="flex items-center justify-between p-5 pb-3">
                <h3 className="font-semibold">Recent Dividends</h3>
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setTab("dividends")}>View All <ArrowUpRight className="h-3 w-3" /></Button>
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
                    {upcomingDividends.slice(0, 5).map((d) => (
                      <TableRow key={d.symbol}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StockLogo symbol={d.symbol} size={22} />
                            <span className="font-medium text-sm">{d.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{d.payDate}</TableCell>
                        <TableCell className="text-right tabular-nums">{pkr(d.total)}</TableCell>
                        <TableCell className="text-right tabular-nums">{pkr(d.total * 0.85)}</TableCell>
                        <TableCell><Badge variant="outline" className="font-normal">Upcoming</Badge></TableCell>
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
              <p className="text-xs text-muted-foreground">{portfolioHoldings?.length} positions in {portfolio.name}</p>
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
                  {portfolioHoldings?.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-10">No holdings in this portfolio yet.</TableCell></TableRow>
                  ) : portfolioHoldings?.map((h) => (
                    <TableRow key={h.symbol}>
                      <TableCell>
                        <Link to="/stock/$symbol" params={{ symbol: h.symbol }} className="flex items-center gap-3 hover:text-primary">
                          <StockLogo symbol={h.symbol} size={30} />
                          <div>
                            <div className="font-medium text-sm">{h.symbol}</div>
                            <div className="text-xs text-muted-foreground">{h.fullName}</div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">{h.sector}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{h.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(h.avgPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">{h.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.yield}%</TableCell>
                      <TableCell className={cn("text-right tabular-nums font-medium", h.pl >= 0 ? "text-success" : "text-destructive")}>
                        {h.pl >= 0 ? "+" : ""}{h.pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <div className="text-[10px] font-normal">{h.pl >= 0 ? "+" : ""}{h.plPct.toFixed(1)}%</div>
                      </TableCell>
                    </TableRow>
                  ))}
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
                <Link to="/transactions">Manage <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
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
                  {recentTransactions.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs whitespace-nowrap">{t.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockLogo symbol={t.symbol} size={22} />
                          <span className="font-medium text-sm">{t.symbol}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="font-normal">{t.type}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{t.qty}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{pkr(t.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ----------- DIVIDENDS ------------ */}
        <TabsContent value="dividends" className="space-y-4 animate-in fade-in-50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Annual Income" value={pkr(annualDividend)} tone="primary" icon={<Coins className="h-4 w-4" />} />
            <StatCard label="Upcoming" value={pkr(upcomingTotal)} icon={<CalendarDays className="h-4 w-4" />} />
            <StatCard label="Current Yield" value={`${currentYield.toFixed(2)}%`} icon={<PieIcon className="h-4 w-4" />} />
            <StatCard label="Yield on Cost" value={`${yieldOnCost.toFixed(2)}%`} tone="primary" icon={<Target className="h-4 w-4" />} />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingDividends.map((d) => (
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
                      <TableCell className="text-right tabular-nums font-medium">{pkr(d.total)}</TableCell>
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
                <BarChart data={monthlyDividends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => pkr(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="amount" fill="hsl(160 65% 45%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* ----------- PERFORMANCE ------------ */}
        <TabsContent value="performance" className="space-y-4 animate-in fade-in-50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Portfolio Return" value={`${returnPct.toFixed(2)}%`} tone="primary" delta={returnPct} icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Realized Gain" value={pkr(Math.round(profit * 0.15))} icon={<Coins className="h-4 w-4" />} />
            <StatCard label="Unrealized Gain" value={pkr(unrealized)} icon={<TrendingUp className="h-4 w-4" />} delta={unrealizedPct} />
            <StatCard label="CAGR (est.)" value={`${(returnPct / 2).toFixed(2)}%`} icon={<BarChart3 className="h-4 w-4" />} sub="2y avg" />
          </div>

          <Card className="card-elevated p-5">
            <h3 className="font-semibold mb-1">Portfolio Growth</h3>
            <p className="text-xs text-muted-foreground mb-4">Value vs. cost basis</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={portfolioGrowth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => pkr(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" name="Value" stroke="hsl(160 65% 45%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cost" name="Cost" stroke="hsl(220 15% 55%)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bestStock && (
              <Card className="card-elevated p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-success/15 text-success grid place-items-center"><Trophy className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Best Performer</div>
                    <div className="font-semibold">{bestStock.symbol}</div>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-sm text-muted-foreground">{bestStock.fullName}</div>
                  <div className="text-right">
                    <div className="text-2xl font-display font-semibold text-success tabular-nums">+{bestStock.plPct.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground tabular-nums">+{pkr(bestStock.pl)}</div>
                  </div>
                </div>
              </Card>
            )}
            {worstStock && (
              <Card className="card-elevated p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-destructive/15 text-destructive grid place-items-center"><TrendingDown className="h-4 w-4" /></div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">Worst Performer</div>
                    <div className="font-semibold">{worstStock.symbol}</div>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-sm text-muted-foreground">{worstStock.fullName}</div>
                  <div className="text-right">
                    <div className={cn("text-2xl font-display font-semibold tabular-nums", worstStock.plPct >= 0 ? "text-success" : "text-destructive")}>
                      {worstStock.plPct >= 0 ? "+" : ""}{worstStock.plPct.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">{worstStock.pl >= 0 ? "+" : ""}{pkr(worstStock.pl)}</div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Card className="card-elevated p-5">
            <h3 className="font-semibold mb-4">Monthly Returns</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioGrowth.map((g, i, arr) => {
                  const prev = arr[i - 1]?.value ?? g.value;
                  return { month: g.month, ret: ((g.value - prev) / prev) * 100 };
                })}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="ret" radius={[6, 6, 0, 0]}>
                    {portfolioGrowth.map((g, i, arr) => {
                      const prev = arr[i - 1]?.value ?? g.value;
                      const positive = g.value - prev >= 0;
                      return <Cell key={i} fill={positive ? "hsl(160 65% 45%)" : "hsl(0 70% 60%)"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
