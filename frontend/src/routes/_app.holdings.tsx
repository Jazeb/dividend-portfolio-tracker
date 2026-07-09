import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, SlidersHorizontal, Columns3 } from "lucide-react";
import { holdings } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/holdings")({
  component: HoldingsPage,
  head: () => ({ meta: [{ title: "Holdings — PSX Dividend Tracker" }] }),
});

function HoldingsPage() {
  return (
    <>
      <PageHeader title="Holdings" description={`${holdings.length} positions across your portfolios`}
        actions={<>
          <Button variant="outline" size="sm" className="gap-1.5"><Columns3 className="h-4 w-4" />Columns</Button>
          <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-4 w-4" />Export</Button>
        </>} />
      <Card className="card-elevated overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search stocks…" className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><SlidersHorizontal className="h-4 w-4" />Filters</Button>
          <div className="ml-auto text-xs text-muted-foreground">Showing {holdings.length} of {holdings.length}</div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Stock</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">Current</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Yield</TableHead>
                <TableHead className="text-right">YoC</TableHead>
                <TableHead className="text-right">Ann. Dividend</TableHead>
                <TableHead className="text-right">P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => {
                const mv = h.qty * h.currentPrice;
                const pl = (h.currentPrice - h.avgPrice) * h.qty;
                const plPct = ((h.currentPrice - h.avgPrice) / h.avgPrice) * 100;
                const positive = pl >= 0;
                return (
                  <TableRow key={h.symbol} className="cursor-pointer group">
                    <TableCell>
                      <Link to="/stock/$symbol" params={{ symbol: h.symbol }} className="flex items-center gap-3 group-hover:text-primary">
                        <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center text-[10px] font-bold">{h.symbol}</div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{h.symbol}</div>
                          <div className="text-xs text-muted-foreground truncate">{h.name}</div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="font-normal">{h.sector}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{h.qty.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{h.avgPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{h.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{mv.toLocaleString(undefined, { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell className="text-right tabular-nums">{h.dividendYield}%</TableCell>
                    <TableCell className="text-right tabular-nums text-primary">{h.yieldOnCost}%</TableCell>
                    <TableCell className="text-right tabular-nums">{h.annualDividend}</TableCell>
                    <TableCell className={`text-right tabular-nums font-medium ${positive ? "text-success" : "text-destructive"}`}>
                      {positive ? "+" : ""}{pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <div className="text-[10px] font-normal">{positive ? "+" : ""}{plPct.toFixed(1)}%</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
