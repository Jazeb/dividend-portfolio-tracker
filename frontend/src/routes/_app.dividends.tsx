import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coins, CalendarDays, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  dividendGrowth,
  sectorAllocation,
  holdings as seedHoldings,
  upcomingDividends,
  monthlyDividends,
  portfolios,
  pkr,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dividends")({
  component: DividendsPage,
  head: () => ({ meta: [{ title: "Dividends — PSX Dividend Tracker" }] }),
});

const rawColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

// Deterministically assign each holding to a portfolio
const holdingsWithPortfolio = seedHoldings.map((h, i) => ({
  ...h,
  portfolioId: portfolios[i % portfolios.length].id,
}));

function DividendsPage() {
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");

  const { filteredHoldings, share, filteredUpcoming } = useMemo(() => {
    const totalIncome = holdingsWithPortfolio.reduce((s, h) => s + h.annualDividend * h.qty, 0);
    const filtered =
      portfolioFilter === "all"
        ? holdingsWithPortfolio
        : holdingsWithPortfolio.filter((h) => h.portfolioId === portfolioFilter);
    const filteredIncome = filtered.reduce((s, h) => s + h.annualDividend * h.qty, 0);
    const s = totalIncome > 0 ? filteredIncome / totalIncome : 0;
    const symbols = new Set(filtered.map((h) => h.symbol));
    const upcoming =
      portfolioFilter === "all"
        ? upcomingDividends
        : upcomingDividends.filter((d) => symbols.has(d.symbol));
    return { filteredHoldings: filtered, share: s, filteredUpcoming: upcoming };
  }, [portfolioFilter]);

  const scale = portfolioFilter === "all" ? 1 : share;
  const scaled = (n: number) => Math.round(n * scale);
  const activePortfolio = portfolios.find((p) => p.id === portfolioFilter);

  const scaledGrowth = useMemo(
    () => dividendGrowth.map((d) => ({ ...d, amount: scaled(d.amount) })),
    [scale],
  );
  const scaledMonthly = useMemo(
    () => monthlyDividends.map((d) => ({ ...d, amount: scaled(d.amount) })),
    [scale],
  );
  const sectorData = useMemo(() => {
    if (portfolioFilter === "all") return sectorAllocation;
    const bySector = new Map<string, number>();
    filteredHoldings.forEach((h) => {
      const income = h.annualDividend * h.qty;
      bySector.set(h.sector, (bySector.get(h.sector) ?? 0) + income);
    });
    const total = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
    return [...bySector.entries()].map(([name, value]) => ({
      name,
      value: Math.round((value / total) * 100),
    }));
  }, [portfolioFilter, filteredHoldings]);

  return (
    <>
      <PageHeader
        title="Dividends"
        description="Your dividend income at a glance"
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
          Showing dividends for <span className="font-medium text-foreground">{activePortfolio.name}</span> · {filteredHoldings.length} holdings
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Annual Income" value={pkr(scaled(465_000))} delta={24.2} icon={<Coins className="h-4 w-4" />} tone="primary" />
        <StatCard label="Monthly Avg" value={pkr(scaled(38_700))} delta={6.4} icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard label="Upcoming" value={pkr(scaled(22_200))} sub="next 30d" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Paid YTD" value={pkr(scaled(268_000))} delta={18.4} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Pending" value={pkr(scaled(46_000))} sub={`${filteredUpcoming.length} events`} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Dividend Growth</CardTitle><CardDescription>Year over year</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={scaledGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">By Sector</CardTitle><CardDescription>Income breakdown</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sectorData} innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {sectorData.map((_, i) => <Cell key={i} fill={rawColors[i % rawColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">Monthly Cash Flow</CardTitle><CardDescription>2026</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={scaledMonthly}>
                <defs><linearGradient id="gDiv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.4} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#gDiv)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">Dividend Timeline</CardTitle><CardDescription>Upcoming events</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {filteredUpcoming.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">No upcoming dividends for this portfolio.</div>
            )}
            {filteredUpcoming.map((d, i) => (
              <div key={d.symbol} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                  {i < filteredUpcoming.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{d.symbol}</div>
                    <div className="text-sm font-semibold text-success tabular-nums">+PKR {d.total.toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{d.company} · {d.amount}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Ex: {d.exDate} · Pay: {d.payDate}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle className="text-base">Breakdown by Stock</CardTitle><CardDescription>Annual contribution</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {filteredHoldings.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">No holdings in this portfolio.</div>
          )}
          {filteredHoldings.map((h) => {
            const income = h.annualDividend * h.qty;
            const total = filteredHoldings.reduce((s, x) => s + x.annualDividend * x.qty, 0) || 1;
            const shareOfPortfolio = (income / total) * 100;
            return (
              <div key={h.symbol} className="grid grid-cols-[100px_1fr_140px] gap-3 items-center">
                <div className="text-sm font-medium">{h.symbol}</div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.min(shareOfPortfolio, 100)}%` }} />
                </div>
                <div className="text-right text-sm tabular-nums">
                  <span className="font-semibold">{pkr(income)}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px]">{shareOfPortfolio.toFixed(1)}%</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}
