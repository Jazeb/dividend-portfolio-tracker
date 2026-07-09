import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, LayoutGrid, List } from "lucide-react";
import { holdings, watchlist } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/screener")({
  component: ScreenerPage,
  head: () => ({ meta: [{ title: "Stock Screener — PSX Dividend Tracker" }] }),
});

const all = [...holdings, ...watchlist.map((w) => ({ symbol: w.symbol, name: w.name, sector: "Various", qty: 0, avgPrice: 0, currentPrice: w.price, dividendYield: w.yield, yieldOnCost: w.yield, annualDividend: w.price * w.yield / 100 }))];

function ScreenerPage() {
  return (
    <>
      <PageHeader title="Stock Screener" description="Filter PSX stocks by your dividend criteria" />
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <Card className="card-elevated h-fit">
          <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div><Label className="text-xs">Search</Label><div className="relative mt-1.5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Symbol or name" className="pl-9 h-9" /></div></div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Dividend Yield</Label><span className="text-xs tabular-nums">4–15%</span></div>
              <Slider defaultValue={[4, 15]} min={0} max={20} step={0.5} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">P/E Ratio</Label><span className="text-xs tabular-nums">2–20</span></div>
              <Slider defaultValue={[2, 20]} min={0} max={40} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Dividend CAGR</Label><span className="text-xs tabular-nums">≥ 10%</span></div>
              <Slider defaultValue={[10]} min={0} max={30} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">ROE</Label><span className="text-xs tabular-nums">≥ 15%</span></div>
              <Slider defaultValue={[15]} min={0} max={40} />
            </div>
            <div><Label className="text-xs mb-2 block">Sector</Label>
              <div className="flex flex-wrap gap-1.5">
                {["Banking", "Energy", "Cement", "Fertilizer", "Tech"].map((s) => (<Badge key={s} variant="outline" className="cursor-pointer hover:bg-accent">{s}</Badge>))}
              </div>
            </div>
            <Button className="w-full">Apply Filters</Button>
          </CardContent>
        </Card>

        <div>
          <Tabs defaultValue="cards">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-muted-foreground">{all.length} results</div>
              <TabsList><TabsTrigger value="cards" className="gap-1.5 text-xs"><LayoutGrid className="h-3.5 w-3.5" />Cards</TabsTrigger><TabsTrigger value="table" className="gap-1.5 text-xs"><List className="h-3.5 w-3.5" />Table</TabsTrigger></TabsList>
            </div>
            <TabsContent value="cards" className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-0">
              {all.slice(0, 8).map((s) => (
                <Card key={s.symbol} className="card-elevated p-4 hover:shadow-glow transition">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg gradient-primary grid place-items-center text-white text-xs font-bold">{s.symbol.slice(0, 3)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{s.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.name}</div>
                    </div>
                    <div className="text-right"><div className="font-semibold tabular-nums">{s.currentPrice.toFixed(2)}</div><div className="text-xs text-primary tabular-nums">{s.dividendYield}%</div></div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="table" className="mt-0">
              <Card className="card-elevated overflow-hidden">
                <Table>
                  <TableHeader><TableRow><TableHead>Stock</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Yield</TableHead><TableHead className="text-right">Ann. Div</TableHead></TableRow></TableHeader>
                  <TableBody>{all.map((s) => (<TableRow key={s.symbol}><TableCell className="font-medium">{s.symbol}<div className="text-xs text-muted-foreground">{s.name}</div></TableCell><TableCell className="text-right tabular-nums">{s.currentPrice.toFixed(2)}</TableCell><TableCell className="text-right tabular-nums text-primary">{s.dividendYield}%</TableCell><TableCell className="text-right tabular-nums">{s.annualDividend.toFixed(2)}</TableCell></TableRow>))}</TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
