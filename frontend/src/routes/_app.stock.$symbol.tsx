import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Plus, Star } from "lucide-react";
import { holdings, portfolioGrowth, dividendGrowth, pkr } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/stock/$symbol")({
  component: StockDetail,
  head: ({ params }) => ({ meta: [{ title: `${params.symbol} — PSX Dividend Tracker` }] }),
});

function StockDetail() {
  const { symbol } = Route.useParams();
  const h = holdings.find((x) => x.symbol === symbol) ?? holdings[0];

  const metrics = [
    ["Market Cap", "PKR 612B"], ["P/E Ratio", "4.8"], ["P/BV", "0.9"],
    ["EPS", "PKR 29.6"], ["ROE", "22.4%"], ["Payout Ratio", "48%"],
    ["Dividend CAGR", "16.2%"], ["Beta", "0.86"],
  ];

  return (
    <>
      <div className="flex items-center gap-2 mb-4 text-sm">
        <Link to="/holdings" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" />Holdings</Link>
      </div>
      <PageHeader title={`${h.symbol} · ${h.name}`} description={`${h.sector} · PSX`}
        actions={<><Button variant="outline" size="sm" className="gap-1.5"><Star className="h-4 w-4" />Watch</Button><Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Buy</Button></>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Current Price" value={`PKR ${h.currentPrice.toFixed(2)}`} delta={2.4} tone="primary" />
        <StatCard label="Dividend Yield" value={`${h.dividendYield}%`} delta={0.3} />
        <StatCard label="Yield on Cost" value={`${h.yieldOnCost}%`} delta={1.2} />
        <StatCard label="Annual Dividend" value={`PKR ${h.annualDividend}`} sub="per share" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="card-elevated lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between">
            <div><CardTitle className="text-base">Price Chart</CardTitle><CardDescription>Historical price movement</CardDescription></div>
            <Tabs defaultValue="1y"><TabsList className="h-8">{["1D", "1M", "3M", "1Y", "5Y"].map((r) => (<TabsTrigger key={r} value={r.toLowerCase()} className="h-6 text-xs px-2">{r}</TabsTrigger>))}</TabsList></Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioGrowth.map((p, i) => ({ month: p.month, price: h.currentPrice * (0.7 + i * 0.03) }))}>
                <defs><linearGradient id="sp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} fill="url(#sp)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">Key Metrics</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {metrics.map(([k, v]) => (
              <div key={k}><div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div><div className="text-sm font-semibold tabular-nums mt-1">{v}</div></div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">Dividend History</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dividendGrowth}>
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
          <CardHeader><CardTitle className="text-base">Corporate Actions</CardTitle><CardDescription>Recent announcements</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[
              { date: "Jul 08 2026", type: "Dividend", detail: "PKR 3.5/share cash dividend declared" },
              { date: "Apr 22 2026", type: "Bonus", detail: "5% bonus shares issued" },
              { date: "Jan 15 2026", type: "AGM", detail: "Annual General Meeting held" },
              { date: "Oct 10 2025", type: "Dividend", detail: "PKR 3.0/share interim dividend" },
            ].map((a, i) => (
              <div key={i} className="flex gap-3 rounded-lg border p-3">
                <Badge variant="secondary" className="h-fit shrink-0 text-[10px]">{a.type}</Badge>
                <div className="min-w-0"><div className="text-sm">{a.detail}</div><div className="text-xs text-muted-foreground mt-0.5">{a.date}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated">
        <CardHeader><CardTitle className="text-base">Your Holdings Summary</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div><div className="text-[10px] uppercase text-muted-foreground">Quantity</div><div className="text-lg font-semibold tabular-nums">{h.qty.toLocaleString()}</div></div>
          <div><div className="text-[10px] uppercase text-muted-foreground">Avg Cost</div><div className="text-lg font-semibold tabular-nums">{h.avgPrice.toFixed(2)}</div></div>
          <div><div className="text-[10px] uppercase text-muted-foreground">Market Value</div><div className="text-lg font-semibold tabular-nums">{pkr(h.qty * h.currentPrice)}</div></div>
          <div><div className="text-[10px] uppercase text-muted-foreground">Unrealized P/L</div><div className="text-lg font-semibold tabular-nums text-success">+{pkr((h.currentPrice - h.avgPrice) * h.qty)}</div></div>
          <div><div className="text-[10px] uppercase text-muted-foreground">Annual Income</div><div className="text-lg font-semibold tabular-nums text-primary">{pkr(h.annualDividend * h.qty)}</div></div>
        </CardContent>
      </Card>
    </>
  );
}
