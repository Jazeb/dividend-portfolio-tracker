import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pkr } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/retirement")({
  component: RetirementPage,
  head: () => ({ meta: [{ title: "Retirement Planner — PSX Dividend Tracker" }] }),
});

function RetirementPage() {
  const [age, setAge] = useState(32);
  const [retire, setRetire] = useState(55);
  const [portfolio, setPortfolio] = useState(5_150_000);
  const [monthly, setMonthly] = useState(85_000);
  const [cagr, setCagr] = useState(18);
  const [yieldPct, setYieldPct] = useState(9);
  const [inflation, setInflation] = useState(12);

  const data = useMemo(() => {
    const years = retire - age;
    let bal = portfolio;
    return Array.from({ length: years + 1 }, (_, i) => {
      if (i > 0) bal = bal * (1 + cagr / 100) + monthly * 12;
      return { year: age + i, portfolio: Math.round(bal), dividend: Math.round(bal * (yieldPct / 100)) };
    });
  }, [age, retire, portfolio, monthly, cagr, yieldPct]);

  const final = data[data.length - 1];
  const monthlyIncome = final.dividend / 12;
  const realIncome = monthlyIncome / Math.pow(1 + inflation / 100, retire - age);

  const inputs = [
    { label: "Current Age", value: age, set: setAge, min: 18, max: 70, step: 1, fmt: (v: number) => `${v} yrs` },
    { label: "Retirement Age", value: retire, set: setRetire, min: age + 1, max: 80, step: 1, fmt: (v: number) => `${v} yrs` },
    { label: "Expected CAGR", value: cagr, set: setCagr, min: 5, max: 30, step: 0.5, fmt: (v: number) => `${v}%` },
    { label: "Dividend Yield", value: yieldPct, set: setYieldPct, min: 2, max: 15, step: 0.5, fmt: (v: number) => `${v}%` },
    { label: "Inflation", value: inflation, set: setInflation, min: 2, max: 20, step: 0.5, fmt: (v: number) => `${v}%` },
  ];

  return (
    <>
      <PageHeader title="Retirement Planner" description="Model your path to financial independence" />
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-base">Assumptions</CardTitle><CardDescription>Adjust to model outcomes</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between mb-1.5"><Label>Current Portfolio</Label><span className="text-sm font-medium tabular-nums">{pkr(portfolio)}</span></div>
              <Input type="number" value={portfolio} onChange={(e) => setPortfolio(+e.target.value)} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label>Monthly Investment</Label><span className="text-sm font-medium tabular-nums">{pkr(monthly)}</span></div>
              <Input type="number" value={monthly} onChange={(e) => setMonthly(+e.target.value)} />
            </div>
            {inputs.map((i) => (
              <div key={i.label}>
                <div className="flex justify-between mb-1.5"><Label>{i.label}</Label><span className="text-sm font-medium tabular-nums">{i.fmt(i.value)}</span></div>
                <Slider value={[i.value]} min={i.min} max={i.max} step={i.step} onValueChange={([v]) => i.set(v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-elevated p-5">
              <div className="text-xs uppercase text-muted-foreground tracking-widest">Projected Portfolio</div>
              <div className="text-3xl font-display font-semibold tabular-nums mt-2 text-gradient">{pkr(final.portfolio)}</div>
              <div className="text-xs text-muted-foreground mt-1">at age {retire}</div>
            </Card>
            <Card className="card-elevated p-5">
              <div className="text-xs uppercase text-muted-foreground tracking-widest">Annual Dividend</div>
              <div className="text-3xl font-display font-semibold tabular-nums mt-2">{pkr(final.dividend)}</div>
              <div className="text-xs text-success mt-1 tabular-nums">{pkr(monthlyIncome)}/month</div>
            </Card>
            <Card className="card-elevated p-5">
              <div className="text-xs uppercase text-muted-foreground tracking-widest">Real Income (today)</div>
              <div className="text-3xl font-display font-semibold tabular-nums mt-2">{pkr(realIncome)}</div>
              <div className="text-xs text-muted-foreground mt-1">inflation-adjusted /mo</div>
            </Card>
          </div>

          <Card className="card-elevated">
            <CardHeader><CardTitle className="text-base">Wealth Trajectory</CardTitle><CardDescription>Portfolio vs annual dividend</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="rp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="rd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="year" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} className="text-xs" tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v: number) => pkr(v)} />
                  <Area type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2.5} fill="url(#rp)" />
                  <Area type="monotone" dataKey="dividend" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rd)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
