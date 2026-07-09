import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Target, TrendingUp, Calendar, Wallet, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/goals")({
  component: GoalsPage,
  head: () => ({ meta: [{ title: "Goals — PSX Dividend Tracker" }] }),
});

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  monthly: number;
  annualReturn: number; // percent, used to compute years
};

const seedGoals: Goal[] = [
  { id: "g1", name: "PKR 100K Monthly Dividend", target: 13_800_000, current: 5_150_000, monthly: 45_000, annualReturn: 12 },
  { id: "g2", name: "Retirement Corpus", target: 50_000_000, current: 5_150_000, monthly: 85_000, annualReturn: 12 },
  { id: "g3", name: "Kids Education Fund", target: 8_000_000, current: 685_000, monthly: 32_000, annualReturn: 10 },
];

// Solve years for FV of current + monthly contributions at annualReturn
function projectYears(current: number, target: number, monthly: number, annualReturn: number) {
  if (current >= target) return 0;
  const r = annualReturn / 100 / 12;
  const pmt = monthly;
  const pv = current;
  const fv = target;
  // Binary search months 0..1200
  let lo = 0, hi = 1200;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const grown = pv * Math.pow(1 + r, mid) + (r === 0 ? pmt * mid : pmt * ((Math.pow(1 + r, mid) - 1) / r));
    if (grown < fv) lo = mid; else hi = mid;
  }
  return +(hi / 12).toFixed(1);
}

type FormState = {
  name: string;
  target: string;
  current: string;
  monthly: string;
  annualReturn: string;
};

const defaultForm: FormState = { name: "", target: "", current: "0", monthly: "", annualReturn: "12" };

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(seedGoals);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const computed = useMemo(
    () =>
      goals.map((g) => {
        const years = projectYears(g.current, g.target, g.monthly, g.annualReturn);
        const needed = Math.max(0, g.target - g.current);
        return { ...g, years, needed };
      }),
    [goals],
  );

  function resetAndClose() {
    setForm(defaultForm);
    setOpen(false);
  }

  function handleSave() {
    const name = form.name.trim();
    const target = Number(form.target);
    const current = Number(form.current);
    const monthly = Number(form.monthly);
    const annualReturn = Number(form.annualReturn);
    if (!name) return toast.error("Goal name is required");
    if (!target || target <= 0) return toast.error("Target must be greater than 0");
    if (current < 0 || monthly < 0 || annualReturn < 0) return toast.error("Values cannot be negative");
    setGoals((prev) => [
      ...prev,
      { id: `g${Date.now()}`, name, target, current, monthly, annualReturn },
    ]);
    toast.success("Goal added");
    resetAndClose();
  }

  function handleDelete(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    toast.success("Goal removed");
  }

  return (
    <>
      <PageHeader
        title="Financial Goals"
        description="Track progress toward your dividend milestones"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        }
      />
      <div className="space-y-4">
        {computed.length === 0 && (
          <Card className="card-elevated p-10 text-center text-sm text-muted-foreground">
            No goals yet. Click "New Goal" to add your first milestone.
          </Card>
        )}
        {computed.map((g) => {
          const pct = Math.min(100, (g.current / g.target) * 100);
          return (
            <Card key={g.id} className="card-elevated p-6">
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl gradient-primary grid place-items-center text-white shadow-glow">
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{g.name}</div>
                      <div className="text-xs text-muted-foreground">
                        On track · {pct.toFixed(1)}% complete
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(g.id)}
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Progress value={pct} className="h-3 mt-4" />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-muted-foreground tabular-nums">
                      Current: PKR {(g.current / 1000).toFixed(0)}K
                    </span>
                    <span className="font-medium tabular-nums">
                      Target: PKR {(g.target / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:min-w-[400px]">
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Years
                    </div>
                    <div className="text-lg font-semibold tabular-nums mt-1">{g.years}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Remaining
                    </div>
                    <div className="text-lg font-semibold tabular-nums mt-1">
                      PKR {(g.needed / 1_000_000).toFixed(2)}M
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      Monthly
                    </div>
                    <div className="text-lg font-semibold tabular-nums mt-1">
                      PKR {(g.monthly / 1000).toFixed(0)}K
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground">Forecast</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {2026 + Math.round(g.years)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Financial Goal</DialogTitle>
            <DialogDescription>
              Add a milestone. Years-to-goal is projected from your monthly contribution and expected annual return.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                placeholder="e.g. House down payment"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="goal-target">Target (PKR)</Label>
                <Input
                  id="goal-target"
                  type="number"
                  inputMode="decimal"
                  placeholder="10000000"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="goal-current">Current (PKR)</Label>
                <Input
                  id="goal-current"
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="goal-monthly">Monthly contribution</Label>
                <Input
                  id="goal-monthly"
                  type="number"
                  inputMode="decimal"
                  placeholder="50000"
                  value={form.monthly}
                  onChange={(e) => setForm({ ...form, monthly: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="goal-return">Expected return</Label>
                <Select
                  value={form.annualReturn}
                  onValueChange={(v) => setForm({ ...form, annualReturn: v })}
                >
                  <SelectTrigger id="goal-return">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["6", "8", "10", "12", "15", "18"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}% / year
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
