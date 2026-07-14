import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// import { Plus, Search, Download, Filter, ArrowRightLeft, Loader2 } from "lucide-react";
import { portfolios } from "@/lib/mock-data";
import { toast } from "sonner";
import {
  transactionsApi,
  type CreateTransactionDto,
  type Transaction,
  type TxType,
} from "@/lib/api/transactions";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Download,
  Filter,
  ArrowRightLeft,
  Loader2,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { stocksApi, type Stock } from "@/lib/api/stocks";
import { portfoliosApi, type Portfolio } from "@/lib/api/portfolios";

const TX_TYPES: TxType[] = ["Buy", "Sell", "Dividend", "Bonus", "Rights", "Split", "Transfer"];
const BROKERS = ["AKD Securities", "JS Global", "Arif Habib"];

export const Route = createFileRoute("/_app/transactions")({
  component: TransactionsPage,
  head: () => ({ meta: [{ title: "Transactions — PSX Dividend Tracker" }] }),
});

function TransactionsPage() {
  const queryClient = useQueryClient();
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [stockPickerOpen, setStockPickerOpen] = useState(false);
  const stocksQuery = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksApi.list(),
    staleTime: 5 * 60_000,
  });
  const stocks: Stock[] = stocksQuery.data ?? [];

  const portfolioQuery = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => portfoliosApi.list(),
    staleTime: 5 * 60_000,
  });
  const portfolios: Portfolio[] = portfolioQuery.data ?? [];

  const txQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: () => transactionsApi.list(),
  });

  const portfolioName = (id: string) => portfolios.find((p) => p.id === id)?.name ?? id;

  const createMutation = useMutation({
    mutationFn: (dto: CreateTransactionDto) => transactionsApi.create(dto),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(
        // created.transactionType === "Transfer" && created.toPortfolioId
        //   ? `Transferred ${created.quantity} ${created.stock.symbol}: ${portfolioName(
        //       created.portfolioId,
        //     )} → ${portfolioName(created.toPortfolioId)}`
        //   :
        `${created.transactionType} ${created.stock.symbol} recorded in ${portfolioName(created.portfolioId)}`,
      );
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save transaction"),
  });

  const txs: Transaction[] = txQuery.data ?? [];

  const defaultForm = () => ({
    transactionType: "Buy" as TxType,
    purchaseDate: new Date().toISOString().slice(0, 10),
    stock: {
      symbol: "",
    },
    quantity: "",
    buyingPrice: "",
    broker: BROKERS[0],
    portfolioId: portfolioFilter !== "all" ? portfolioFilter : portfolios[0]?.id,
    // toPortfolioId: portfolios[1]?.id ?? portfolios[0].id,
  });
  const [form, setForm] = useState(defaultForm);

  const filtered = useMemo(() => {
    return txs.filter((t) => {
      if (portfolioFilter !== "all" && t.portfolioId !== portfolioFilter) return false;
      if (typeFilter !== "All" && t.transactionType !== typeFilter.toUpperCase()) return false;
      if (search && !t.stock.symbol.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [txs, portfolioFilter, typeFilter, search]);

  const openDialog = () => {
    setForm(defaultForm());
    setOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const symbol = form.stock.symbol.trim().toUpperCase();
    if (!symbol) return toast.error("Stock symbol is required");
    if (!form.portfolioId) return toast.error("Portfolio is required");
    // if (form.transactionType === "Transfer" && form.portfolioId === form.toPortfolioId) {
    //   return toast.error("Source and destination portfolios must differ");
    // }
    const quantity = Number(form.quantity) || 0;
    const buyingPrice = Number(form.buyingPrice) || 0;
    const noValueTypes: TxType[] = ["Transfer", "Bonus", "Rights", "Split"];
    const dto: CreateTransactionDto = {
      purchaseDate: form.purchaseDate,
      transactionType: form.transactionType,
      quantity,
      buyingPrice,
      totalBuyingPrice: noValueTypes.includes(form.transactionType) ? 0 : quantity * buyingPrice,
      portfolioId: form.portfolioId,
      broker: form.broker,
      symbol: form.stock.symbol,
      // toPortfolioId: form.transactionType === "Transfer" ? form.toPortfolioId : undefined,
    };
    console.log(dto);
    createMutation.mutate(dto);
  };

  const isTransfer = form.transactionType === "Transfer";

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Complete history of your investing activity, scoped to each portfolio."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openDialog}>
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        }
      />

      <Card className="card-elevated overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b">
          <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Portfolios</SelectItem>
              {portfolios.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {["All", ...TX_TYPES].map((t) => (
              <Button
                key={t}
                variant={t === typeFilter ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setTypeFilter(t)}
              >
                {t}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 ml-auto">
            <Filter className="h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Portfolio</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Broker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-sm text-muted-foreground py-10"
                  >
                    <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                    Loading transactions…
                  </TableCell>
                </TableRow>
              )}
              {txQuery.isError && !txQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-destructive py-10">
                    Failed to load transactions: {(txQuery.error as Error).message}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => txQuery.refetch()}
                      className="ml-2"
                    >
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {!txQuery.isLoading && !txQuery.isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-sm text-muted-foreground py-10"
                  >
                    No transactions match these filters.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm text-muted-foreground">{t.purchaseDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        t.transactionType === "Buy"
                          ? "default"
                          : t.transactionType === "Sell"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {t.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {/* {t.transactionType === "Transfer" && t.toPortfolioId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span>{portfolioName(t.portfolioId)}</span>
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                        <span>{portfolioName(t.toPortfolioId)}</span>
                      </span>
                    ) : ()} */}
                    {portfolioName(t.portfolioId)}
                  </TableCell>
                  <TableCell className="font-medium">{t.stock.symbol}</TableCell>
                  <TableCell className="font-medium">{t.stock.fullName}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.buyingPrice || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {t.totalBuyingPrice ? `PKR ${t.totalBuyingPrice.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.broker ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>New Transaction</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.transactionType}
                    onValueChange={(v) => setForm({ ...form, transactionType: v as TxType })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TX_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    className="mt-1.5"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{isTransfer ? "From Portfolio" : "Portfolio"}</Label>
                <Select
                  value={form.portfolioId}
                  onValueChange={(v) => setForm({ ...form, portfolioId: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* {isTransfer && (
                <div>
                  <Label>To Portfolio</Label>
                  <Select
                    value={form.toPortfolioId}
                    onValueChange={(v) => setForm({ ...form, toPortfolioId: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} */}

              <div>
                <Label>Stock</Label>
                {/* <Input
                  placeholder="e.g. OGDC"
                  className="mt-1.5"
                  value={form.stock.symbol}
                  onChange={(e) => setForm({ ...form, stock: { symbol: e.target.value } })}
                /> */}
                <Popover open={stockPickerOpen} onOpenChange={setStockPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={stockPickerOpen}
                      className="mt-1.5 w-full justify-between font-normal"
                      disabled={stocksQuery.isLoading}
                    >
                      {stocksQuery.isLoading ? (
                        <span className="inline-flex items-center text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading stocks…
                        </span>
                      ) : form.stock.symbol ? (
                        (() => {
                          const s = stocks.find((x) => x.symbol === form.stock.symbol);
                          return (
                            <span className="truncate">
                              <span className="font-medium">{form.stock.symbol}</span>
                              {s?.name ? (
                                <span className="text-muted-foreground"> — {s.name}</span>
                              ) : null}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">Select a stock…</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command
                      filter={(value, search) =>
                        value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                      }
                    >
                      <CommandInput placeholder="Search symbol or name…" />
                      <CommandList>
                        {stocksQuery.isError && (
                          <div className="p-3 text-sm text-destructive">
                            Failed to load stocks.
                            <Button
                              variant="link"
                              size="sm"
                              className="ml-1 h-auto p-0"
                              onClick={() => stocksQuery.refetch()}
                            >
                              Retry
                            </Button>
                          </div>
                        )}
                        <CommandEmpty>No stocks found.</CommandEmpty>
                        <CommandGroup>
                          {stocks.map((s) => (
                            <CommandItem
                              key={s.symbol}
                              value={`${s.symbol} ${s.name ?? ""}`}
                              onSelect={() => {
                                setForm({ ...form, stock: { symbol: s.symbol } });
                                setStockPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.stock.symbol === s.symbol ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="font-medium">{s.symbol}</span>
                              {s.name && (
                                <span className="ml-2 text-muted-foreground truncate">
                                  {s.name}
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    placeholder="0.00"
                    disabled={isTransfer}
                    value={form.buyingPrice}
                    onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
                  />
                </div>
              </div>
              {!isTransfer && (
                <div>
                  <Label>Broker</Label>
                  <Select
                    value={form.broker}
                    onValueChange={(v) => setForm({ ...form, broker: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BROKERS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
