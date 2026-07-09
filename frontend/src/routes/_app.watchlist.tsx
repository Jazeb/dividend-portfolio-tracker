import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { watchlist } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/watchlist")({
  component: WatchlistPage,
  head: () => ({ meta: [{ title: "Watchlist — PSX Dividend Tracker" }] }),
});

function WatchlistPage() {
  return (
    <>
      <PageHeader title="Watchlist" description="Stocks you're tracking for future entry"
        actions={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Stock</Button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {watchlist.map((w) => {
          const positive = w.change >= 0;
          return (
            <Card key={w.symbol} className="card-elevated p-5 hover:shadow-glow hover:-translate-y-0.5 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl gradient-primary grid place-items-center text-white font-bold text-xs shrink-0">{w.symbol.slice(0, 3)}</div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{w.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">{w.name}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{w.mcap}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-display font-semibold tabular-nums">{w.price.toLocaleString()}</div>
                <div className={`text-xs font-medium inline-flex items-center gap-0.5 ${positive ? "text-success" : "text-destructive"}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? "+" : ""}{w.change}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t text-xs">
                <div><div className="text-muted-foreground">Yield</div><div className="font-medium text-primary tabular-nums">{w.yield}%</div></div>
                <div><div className="text-muted-foreground">Div Growth</div><div className="font-medium tabular-nums">{w.growth}%</div></div>
                <div><div className="text-muted-foreground">52W High</div><div className="font-medium tabular-nums">{w.high52}</div></div>
                <div><div className="text-muted-foreground">52W Low</div><div className="font-medium tabular-nums">{w.low52}</div></div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 gap-1.5"><Plus className="h-3.5 w-3.5" />Add to Portfolio</Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
