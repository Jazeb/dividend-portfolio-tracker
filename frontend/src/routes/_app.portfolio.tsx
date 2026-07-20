import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ArrowUpRight, TrendingUp, Loader2 } from "lucide-react";
import { portfolios as seedPortfolios, pkr } from "@/lib/mock-data";
import { portfoliosApi } from "@/lib/api/portfolios";
import { toast } from "sonner";
import { Portfolio, PortfolioDashboard } from "@/types/index";

export const Route = createFileRoute("/_app/portfolio")({
  component: PortfolioPage,
  head: () => ({ meta: [{ title: "Portfolios — PSX Dividend Tracker" }] }),
});

const STRATEGIES = [
  "Dividend Growth",
  "High Yield",
  "Retirement",
  "Education",
  "Speculative",
  "Other",
];

// When VITE_API_BASE_URL is unset (e.g. on Lovable preview), fall back to seed data.
const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

function calculateProfitFromPortfolio(portfolio: Portfolio) {
  const holdings = portfolio.holdings;
  let profit = 0;
  let pct = 0;
  // let dividendYield = 0;

  holdings?.forEach((holding) => {
    const _profit = holding.quantity * holding.stocks.currentPrice - holding.totalCost;
    profit += _profit;
    pct = holding.totalCost > 0 ? (profit / holding.totalCost) * 100 : 0;
    // dividendYield = holding.stocks.dividendYield
  });
  return { profit, pct };
}

function PortfolioPage() {
  const queryClient = useQueryClient();

  const portfoliosQuery = useQuery<PortfolioDashboard[]>({
    queryKey: ["portfolios"],
    queryFn: () => portfoliosApi.list(),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : (seedPortfolios as PortfolioDashboard[]),
    // Gracefully fall back to seed data when the API is unreachable.
    // placeholderData: seedPortfolios as Portfolio[],
    retry: 1,
  });

  const portfolios = portfoliosQuery.data ?? (seedPortfolios as PortfolioDashboard[]);

  // Local additions used only when the API is not configured.
  const [localExtras, setLocalExtras] = useState<Portfolio[]>([]);
  const allPortfolios = portfolios; // API_ENABLED ? portfolios : [...portfolios, ...localExtras];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    strategy: "Dividend Growth",
    initialCapital: "",
    description: "",
  });

  const reset = () =>
    setForm({ name: "", strategy: "Dividend Growth", initialCapital: "", description: "" });

  const createMutation = useMutation({
    mutationFn: (dto: Omit<Portfolio, "id">) => portfoliosApi.create(dto),
    onSuccess: (created) => {
      toast.success(`"${created.name}" portfolio created`);
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      setOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to create portfolio";
      toast.error(message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Portfolio name is required");
      return;
    }
    if (allPortfolios.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error("A portfolio with this name already exists");
      return;
    }
    // const capital = Number(form.initialCapital) || 0;
    const dto: Omit<Portfolio, "id"> = {
      name,
      // value: capital,
      // cost: capital,
      // dividendIncome: 0,
      // holdings: 0,
      // yield: 0,
      strategy: form.strategy,
      description: form.description.trim() || undefined,
    };

    if (API_ENABLED) {
      createMutation.mutate(dto);
    } else {
      // const newPortfolio: Portfolio = {
      //   ...dto,
      //   id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now().toString(36),
      // };
      // setLocalExtras((prev) => [...prev, newPortfolio]);
      toast.success(`"${name}" portfolio created`);
      setOpen(false);
      reset();
    }
  };

  const isLoading = API_ENABLED && portfoliosQuery.isLoading;
  const isError = API_ENABLED && portfoliosQuery.isError && !portfoliosQuery.data;

  return (
    <>
      <PageHeader
        title="Portfolios"
        description="Track multiple investment strategies in one place."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Portfolio
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading portfolios…
        </div>
      ) : isError ? (
        <Card className="p-6 text-center">
          <div className="text-sm text-destructive mb-3">
            Could not load portfolios from the API.
          </div>
          <Button variant="outline" size="sm" onClick={() => portfoliosQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {allPortfolios.map((p) => {
            const { profit, pct } = calculateProfitFromPortfolio(p);
            const holdings = p.holdings;
            const totalCost = holdings?.reduce(
              (acc, current) => acc + Number(current.totalCost),
              0,
            ) as number;

            const networth = totalCost + profit;
            const positive = profit >= 0;

            return (
              <Link key={p.id} to="/holdings" className="group">
                <Card className="card-elevated p-6 h-full transition hover:shadow-glow hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                        {p.holdings?.length} holdings
                      </div>
                      <div className="text-lg font-semibold">{p.name}</div>
                    </div>
                    <div className="h-10 w-10 rounded-xl gradient-primary grid place-items-center text-white shadow-glow">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-display font-semibold tabular-nums">
                    {pkr(networth)}
                  </div>
                  <div
                    className={`text-xs mt-1 tabular-nums ${positive ? "text-success" : "text-destructive"}`}
                  >
                    {positive ? "+" : ""}
                    {pkr(profit)} ({pct.toFixed(1)}%)
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Cost</div>
                      <div className="text-sm font-medium tabular-nums">{pkr(totalCost)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Dividend</div>
                      <div className="text-sm font-medium tabular-nums">{pkr(p.annualIncome)}</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground">Yield</div>
                      <div className="text-sm font-medium tabular-nums">{p.yield}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                    Open analytics <ArrowUpRight className="h-3 w-3 ml-1" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>New Portfolio</DialogTitle>
              <DialogDescription>
                Group holdings by strategy — dividend growth, retirement, education, and more.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="pf-name">Name</Label>
                <Input
                  id="pf-name"
                  placeholder="e.g. Dividend Growth Portfolio"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <Label>Strategy</Label>
                <Select
                  value={form.strategy}
                  onValueChange={(v) => setForm({ ...form, strategy: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf-capital">Initial Capital (PKR)</Label>
                <Input
                  id="pf-capital"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.initialCapital}
                  onChange={(e) => setForm({ ...form, initialCapital: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf-desc">Description (optional)</Label>
                <Textarea
                  id="pf-desc"
                  placeholder="Notes about this portfolio's purpose or rules…"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-1.5" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Portfolio
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
