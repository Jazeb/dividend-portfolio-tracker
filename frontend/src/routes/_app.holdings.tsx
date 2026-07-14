import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, SlidersHorizontal, Columns3, Loader2 } from "lucide-react";
import { holdings as seedHoldings } from "@/lib/mock-data";

import { holdingsApi, type Holding } from "@/lib/api/holdings";
import { portfoliosApi, type Portfolio } from "@/lib/api/portfolios";

export const Route = createFileRoute("/_app/holdings")({
  component: HoldingsPage,
  head: () => ({ meta: [{ title: "Holdings — PSX Dividend Tracker" }] }),
});

// When VITE_API_BASE_URL is unset (e.g. on Lovable preview), fall back to seed data.
const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

console.log({ API_ENABLED });

function HoldingsPage() {
  function portfolioName(id: string) {
    console.log({ id, portfolios });
    const po = portfolios.find((p) => p.id === id);
    console.log({ po });
    return po?.name;
  }

  const holdingsQuery = useQuery<Holding[]>({
    queryKey: ["holdings"],
    queryFn: () => holdingsApi.list(),
    enabled: API_ENABLED,
    // initialData: API_ENABLED ? undefined : (seedHoldings as Holding[]),
    // placeholderData: seedHoldings as Holding[],
    retry: 1,
  });

  const portfolioQuery = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => portfoliosApi.list(),
    staleTime: 5 * 60_000,
  });

  const portfolios: Portfolio[] = portfolioQuery.data ?? [];

  const holdings: Holding[] = holdingsQuery.data ?? (seedHoldings as Holding[]);

  const isLoading = API_ENABLED && holdingsQuery.isLoading;
  const isError = API_ENABLED && holdingsQuery.isError && !holdingsQuery.data;

  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");

  // Deterministically assign each holding to a portfolio (mirrors dividends page)
  const holdingsWithPortfolio = holdings;
  // useMemo(
  //   () =>
  //     holdings.map((h, i) => ({
  //       ...h,
  //       portfolioId: portfolios[i % portfolios.length].id,
  //     })),
  //   [holdings],
  // );

  const filteredHoldings = useMemo(
    () =>
      portfolioFilter === "all"
        ? holdingsWithPortfolio
        : holdingsWithPortfolio.filter((h) => h.portfolioId === Number(portfolioFilter)),
    [holdingsWithPortfolio, portfolioFilter],
  );

  const activePortfolio = portfolios.find((p) => p.id === portfolioFilter);

  return (
    <>
      <PageHeader
        title="Holdings"
        description={
          activePortfolio
            ? `${filteredHoldings.length} positions in ${activePortfolio.name}`
            : `${holdings.length} positions across your portfolios`
        }
        actions={
          <>
            <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portfolios</SelectItem>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {portfolioName(p.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading holdings…
        </div>
      ) : isError ? (
        <Card className="p-6 text-center">
          <div className="text-sm text-destructive mb-3">Could not load holdings from the API.</div>
          <Button variant="outline" size="sm" onClick={() => holdingsQuery.refetch()}>
            Retry
          </Button>
        </Card>
      ) : (
        <Card className="card-elevated overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-4 border-b">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search stocks…" className="pl-9 h-9" />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              Showing {filteredHoldings.length} of {holdings.length}
            </div>
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
                {filteredHoldings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      No holdings in this portfolio.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHoldings.map((h) => {
                    const mv = h.quantity * h.stocks.currentPrice;
                    const pl = (h.stocks.currentPrice - h.avgPrice) * h.quantity;
                    const plPct = ((h.stocks.currentPrice - h.avgPrice) / h.avgPrice) * 100;
                    const positive = pl >= 0;
                    const yieldOnCost = ((h.stocks.annualDividend / h.avgPrice) * 100).toFixed(2);
                    return (
                      <TableRow key={h.stocks.symbol} className="cursor-pointer group">
                        <TableCell>
                          <Link
                            to="/stock/$symbol"
                            params={{ symbol: h.stocks.symbol }}
                            className="flex items-center gap-3 group-hover:text-primary"
                          >
                            <div className="h-8 w-8 rounded-lg bg-accent grid place-items-center text-[10px] font-bold">
                              {h.symbol}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{h.stocks.symbol}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {h.stocks.fullName}
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {h.stocks.sector.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Number(h.avgPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {Number(h.stocks.currentPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {mv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.stocks.dividendYield}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-primary">
                          {yieldOnCost}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.stocks.annualDividend}
                        </TableCell>
                        <TableCell
                          className={`text-right tabular-nums font-medium ${positive ? "text-success" : "text-destructive"}`}
                        >
                          {positive ? "+" : ""}
                          {pl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          <div className="text-[10px] font-normal">
                            {positive ? "+" : ""}
                            {plPct.toFixed(1)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </>
  );
}
