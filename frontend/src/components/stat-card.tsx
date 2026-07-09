import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label, value, delta, deltaLabel, icon, tone = "default", sub,
}: {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  tone?: "default" | "primary" | "success" | "danger";
  sub?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={cn(
      "card-elevated relative overflow-hidden p-5 flex flex-col gap-3 hover-lift group",
      tone === "primary" && "gradient-mesh border-primary/25",
    )}>
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="flex items-center justify-between relative">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">{label}</span>
        {icon && <div className="h-8 w-8 rounded-lg bg-accent/70 backdrop-blur grid place-items-center text-accent-foreground border border-border/50">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 relative">
        <div className={cn("text-2xl font-semibold font-display tracking-tight tabular-nums", tone === "primary" && "text-gradient")}>{value}</div>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
      {delta !== undefined && (
        <div className="relative">
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            positive ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span className="tabular-nums">{positive ? "+" : ""}{delta.toFixed(2)}%</span>
          </span>
          {deltaLabel && <span className="text-xs text-muted-foreground ml-2">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 mb-6 sm:flex sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight font-display truncate">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
