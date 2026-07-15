import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard, PageHeader } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, TrendingUp, Coins, CalendarDays, Percent, Sparkles, ArrowUpRight, PieChart as PieIcon, Plus, Download,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  portfolioGrowth, dividendGrowth, sectorAllocation, monthlyDividends,
  upcomingDividends, recentTransactions, holdings, pkr,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — PSX Dividend Tracker" }] }),
});

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const rawColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

function Dashboard() {
  const topDividendStocks = [...holdings].sort((a, b) => b.annualDividend * b.qty - a.annualDividend * a.qty).slice(0, 5);
  return (
    <>
      <PageHeader
        title="Good morning, Ali"
        description="Here's how your dividend portfolio is performing today."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Transaction</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Portfolio Value" value="PKR 5.15M" delta={1.82} deltaLabel="today" icon={<Wallet className="h-4 w-4" />} tone="primary" />
        <StatCard label="Today's Gain" value="+PKR 92,400" delta={1.82} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Total Return" value="+PKR 1.09M" delta={26.8} deltaLabel="all-time" icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Annual Dividend" value="PKR 465K" delta={24.2} deltaLabel="YoY" icon={<Coins className="h-4 w-4" />} />
        <StatCard label="Monthly Dividend" value="PKR 38.7K" delta={6.4} deltaLabel="MoM" icon={<CalendarDays className="h-4 w-4" />} />
        <StatCard label="Dividend Yield" value="9.03%" delta={0.4} icon={<Percent className="h-4 w-4" />} />
        <StatCard label="Yield on Cost" value="12.68%" delta={1.1} icon={<Percent className="h-4 w-4" />} />
        <StatCard label="Upcoming Dividend" value="PKR 22.2K" sub="next 30d" icon={<CalendarDays className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 card-elevated">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Portfolio Growth</CardTitle>
              <CardDescription>Value vs cost basis over time</CardDescription>
            </div>
            <Tabs defaultValue="1y">
              <TabsList className="h-8">
                {["1M", "3M", "6M", "1Y", "5Y", "All"].map((r) => (
                  <TabsTrigger key={r} value={r.toLowerCase()} className="h-6 text-xs px-2">{r}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={portfolioGrowth}>
                <defs>
                  <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-popover)" }} />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fill="url(#gVal)" />
                <Area type="monotone" dataKey="cost" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sector Allocation</CardTitle>
            <CardDescription>Diversification breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sectorAllocation} innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {sectorAllocation.map((_, i) => <Cell key={i} fill={rawColors[i % rawColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {sectorAllocation.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: rawColors[i % rawColors.length] }} />
                  <span className="text-muted-foreground truncate">{s.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{s.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dividend Growth</CardTitle>
            <CardDescription>Annual dividend income across years</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dividendGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} formatter={(v: number) => pkr(v)} />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Dividend Heatmap</CardTitle>
            <CardDescription>2026 income distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {monthlyDividends.map((m) => {
                const intensity = Math.min(1, m.amount / 90_000);
                return (
                  <div key={m.month} className="rounded-lg p-2.5 text-center transition hover:scale-105"
                    style={{ background: `oklch(0.62 0.15 160 / ${0.08 + intensity * 0.6})` }}>
                    <div className="text-[10px] uppercase text-muted-foreground">{m.month}</div>
                    <div className="text-xs font-semibold tabular-nums mt-0.5">{(m.amount / 1000).toFixed(0)}K</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="card-elevated">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Dividends</CardTitle>
              <CardDescription>Next 30 days</CardDescription>
            </div>
            <Link to="/dividends" className="text-xs text-primary hover:underline inline-flex items-center gap-1">View all <ArrowUpRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {upcomingDividends.map((d) => (
                <div key={d.symbol} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition">
                  <div className="h-9 w-9 rounded-lg gradient-primary grid place-items-center text-[10px] font-bold text-white">{d.symbol.slice(0, 3)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.company}</div>
                    <div className="text-xs text-muted-foreground">Ex: {d.exDate} · Pay: {d.payDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{d.amount}</div>
                    <div className="text-xs text-success tabular-nums">+PKR {d.total.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <CardDescription>Last activity</CardDescription>
            </div>
            <Link to="/transactions" className="text-xs text-primary hover:underline inline-flex items-center gap-1">View all <ArrowUpRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentTransactions.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition">
                  <Badge variant={t.type === "Buy" ? "default" : t.type === "Sell" ? "destructive" : "secondary"} className="w-16 justify-center text-[10px]">{t.type}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t.symbol}</div>
                    <div className="text-xs text-muted-foreground">{t.date} · Qty {t.qty}</div>
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums">
                    {t.total > 0 ? `PKR ${t.total.toLocaleString()}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Dividend Stocks</CardTitle>
            <CardDescription>Largest income contributors</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topDividendStocks.map((h) => {
                const income = h.annualDividend * h.quantity;
                const share = (income / 465400) * 100;
                return (
                  <div key={h.symbol} className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-accent grid place-items-center text-[10px] font-bold text-accent-foreground">{h.symbol}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{h.name}</div>
                        <div className="text-xs text-muted-foreground">{h.sector} · {h.dividendYield}% yield</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold tabular-nums">PKR {(income / 1000).toFixed(1)}K</div>
                        <div className="text-xs text-muted-foreground tabular-nums">{share.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
                      <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.min(100, share * 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: "Add Transaction", icon: Plus, to: "/transactions" },
              { label: "New Goal", icon: Sparkles, to: "/goals" },
              { label: "Screener", icon: PieIcon, to: "/screener" },
              { label: "Reports", icon: Download, to: "/reports" },
            ].map((a) => (
              <Link key={a.label} to={a.to} className="flex flex-col items-start gap-2 rounded-xl border p-3 hover:border-primary/50 hover:bg-accent/30 transition group">
                <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center group-hover:gradient-primary group-hover:text-white transition">
                  <a.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium">{a.label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
