import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/stat-card";
import { StockLogo } from "@/components/StockLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Building2,
  TrendingUp,
  Trophy,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { pkr, portfolios as seedPortfolios } from "@/lib/mock-data";
import { portfoliosApi } from "@/lib/api/portfolios";
import {
  calendarApi,
  type DividendCalendarEvent,
  type DividendCalendarResponse,
  type DividendEventType,
  type DividendEventStatus,
} from "@/lib/api/calendar";
import { buildMockDividendCalendar } from "@/lib/mock/dividend-calendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Portfolio } from "@/types";

const API_ENABLED = Boolean(
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim(),
);

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
  head: () => ({
    meta: [
      { title: "Dividend Calendar — PSX Dividend Tracker" },
      {
        name: "description",
        content:
          "Interactive dividend events calendar: announcement, ex-date, book closure and payment dates for your PSX portfolio.",
      },
    ],
  }),
});

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_LABEL: Record<DividendEventType, string> = {
  PAYMENT: "Payment",
  EX_DATE: "Ex-Date",
  BOOK_CLOSURE: "Book Closure",
  ANNOUNCEMENT: "Announcement",
};

// Color tokens by event type + paid state
function eventColorClasses(type: DividendEventType, status: DividendEventStatus) {
  if (status === "PAID") {
    return {
      chip: "bg-muted text-muted-foreground border-border/60",
      dot: "bg-muted-foreground",
      ring: "ring-muted-foreground/30",
    };
  }
  switch (type) {
    case "PAYMENT":
      return {
        chip: "bg-emerald-500/12 text-emerald-500 border-emerald-500/25",
        dot: "bg-emerald-500",
        ring: "ring-emerald-500/30",
      };
    case "EX_DATE":
      return {
        chip: "bg-sky-500/12 text-sky-500 border-sky-500/25",
        dot: "bg-sky-500",
        ring: "ring-sky-500/30",
      };
    case "BOOK_CLOSURE":
      return {
        chip: "bg-amber-500/12 text-amber-500 border-amber-500/25",
        dot: "bg-amber-500",
        ring: "ring-amber-500/30",
      };
    case "ANNOUNCEMENT":
      return {
        chip: "bg-violet-500/12 text-violet-500 border-violet-500/25",
        dot: "bg-violet-500",
        ring: "ring-violet-500/30",
      };
  }
}

function shortAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function CalendarPage() {
  const isMobile = useIsMobile();
  const [portfolioId, setPortfolioId] = useState<string>("all");
  const [stockId, setStockId] = useState<string>("all");
  const [status, setStatus] = useState<DividendEventStatus | "ALL">("ALL");
  const [eventType, setEventType] = useState<DividendEventType>("PAYMENT");
  const [cursor, setCursor] = useState(() => new Date(2026, 7, 1)); // Aug 2026
  const [selected, setSelected] = useState<DividendCalendarEvent | null>(null);

  const month = cursor.getMonth() + 1;
  const year = cursor.getFullYear();

  // Portfolios
  const portfoliosQuery = useQuery<Portfolio[]>({
    queryKey: ["portfolios"],
    queryFn: () => portfoliosApi.list(),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : (seedPortfolios as Portfolio[]),
    staleTime: 5 * 60_000,
  });
  const portfolios: Portfolio[] =
    (API_ENABLED ? portfoliosQuery.data : (seedPortfolios as Portfolio[])) ?? [];

  // Calendar data
  const calendarQuery = useQuery<DividendCalendarResponse>({
    queryKey: ["dividends", "calendar", portfolioId, month, year, eventType, stockId, status],
    queryFn: () => {
      const params = {
        portfolioId: portfolioId === "all" ? undefined : portfolioId,
        month,
        year,
        eventType,
        stockId: stockId === "all" ? undefined : stockId,
        status: status === "ALL" ? undefined : status,
      };
      return API_ENABLED
        ? calendarApi.get(params)
        : Promise.resolve(buildMockDividendCalendar(params));
    },
    staleTime: 60_000,
  });

  const data = calendarQuery.data;
  const events = data?.events ?? [];
  const loading = calendarQuery.isLoading;

  // Available stocks for dropdown (union of all events, ignoring stock filter)
  const stockOptions = useMemo(() => {
    // We keep it simple: derive from currently-loaded events; when API is on,
    // the stock filter is best-effort until backend provides full list.
    const map = new Map<string, { id: string; symbol: string; company: string }>();
    events.forEach((e) => {
      const key = String(e.stockId);
      if (!map.has(key)) map.set(key, { id: key, symbol: e.symbol, company: e.company });
    });
    return [...map.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [events]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const m = new Map<number, DividendCalendarEvent[]>();
    events.forEach((e) => {
      const day = new Date(e.eventDate).getDate();
      const arr = m.get(day) ?? [];
      arr.push(e);
      m.set(day, arr);
    });
    return m;
  }, [events]);

  const goPrev = () => setCursor(new Date(year, month - 2, 1));
  const goNext = () => setCursor(new Date(year, month, 1));
  const goToday = () => setCursor(new Date(2026, 6, 1));

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null as number | null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <PageHeader
        title="Dividend Calendar"
        description="Track all upcoming dividend events for your selected portfolio."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={goPrev} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 min-w-[140px] justify-center" onClick={goToday}>
              {MONTHS[month - 1]} {year}
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={goNext} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="card-elevated mb-6">
        <CardContent className="p-4 grid gap-3 grid-cols-2 md:grid-cols-4">
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Portfolio</div>
            <Select value={portfolioId} onValueChange={setPortfolioId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Portfolios</SelectItem>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Stock</div>
            <Select value={stockId} onValueChange={setStockId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stocks</SelectItem>
                {stockOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.symbol} — {s.company}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</div>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Event Type</div>
            <Select value={eventType} onValueChange={(v) => setEventType(v as DividendEventType)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYMENT">Payment Date</SelectItem>
                <SelectItem value="EX_DATE">Ex-Dividend Date</SelectItem>
                <SelectItem value="BOOK_CLOSURE">Book Closure</SelectItem>
                <SelectItem value="ANNOUNCEMENT">Announcement Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Companies This Month"
          value={loading ? "—" : `${data?.summary.companies ?? 0}`}
          sub={data?.summary.companies === 1 ? "Company" : "Companies"}
          icon={<Building2 className="h-4 w-4" />}
        />
        <SummaryCard
          label="Expected Dividend"
          value={loading ? "—" : pkr(data?.summary.expectedDividend ?? 0)}
          sub="Gross this month"
          icon={<Coins className="h-4 w-4" />}
          tone="primary"
        />
        <SummaryCard
          label="Next Event"
          value={loading || !data?.summary.nextEvent ? "—" : data.summary.nextEvent.stock}
          sub={
            loading || !data?.summary.nextEvent
              ? "No upcoming events"
              : `${fmtDateShort(data.summary.nextEvent.date)} · ${EVENT_LABEL[data.summary.nextEvent.type]}`
          }
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <SummaryCard
          label="Largest Dividend"
          value={loading || !data?.summary.largestDividend ? "—" : data.summary.largestDividend.stock}
          sub={
            loading || !data?.summary.largestDividend
              ? ""
              : pkr(data.summary.largestDividend.amount)
          }
          icon={<Trophy className="h-4 w-4" />}
        />
      </div> */}

      {/* Calendar / Agenda */}
      {loading ? (
        <Skeleton className="h-[560px] w-full rounded-2xl" />
      ) : events.length === 0 ? (
        <EmptyState onPrev={goPrev} onNext={goNext} />
      ) : isMobile ? (
        <AgendaView events={events} eventType={eventType} onSelect={setSelected} />
      ) : (
        <Card className="card-elevated animate-fade-in">
          <CardHeader className="border-b py-3">
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-[11px] font-medium text-muted-foreground uppercase text-center tracking-wider">{d}</div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-7 gap-2">
              {cells.map((d, i) => {
                const dayEvents = d ? eventsByDay.get(d) ?? [] : [];
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-h-[110px] rounded-xl border p-2 flex flex-col gap-1 transition",
                      d ? "bg-card hover:bg-accent/20" : "bg-muted/20 border-transparent",
                    )}
                  >
                    {d && (
                      <>
                        <div className="text-xs font-medium text-muted-foreground">{d}</div>
                        <div className="flex flex-col gap-1 overflow-hidden">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <EventChip key={`${ev.symbol}-${ev.eventType}-${ev.eventDate}`} ev={ev} onClick={() => setSelected(ev)} />
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="card-elevated mt-6">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legend</span>
          <LegendDot color="bg-emerald-500" label="Payment" />
          <LegendDot color="bg-sky-500" label="Ex-Date" />
          <LegendDot color="bg-amber-500" label="Book Closure" />
          <LegendDot color="bg-violet-500" label="Announcement" />
          <LegendDot color="bg-muted-foreground" label="Paid" />
        </CardContent>
      </Card>

      {/* Details drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && <EventDetails ev={selected} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ------- Sub-components ---------

function SummaryCard({
  label, value, sub, icon, tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone?: "primary";
}) {
  return (
    <div className={cn(
      "card-elevated relative overflow-hidden p-5 flex flex-col gap-2",
      tone === "primary" && "gradient-mesh border-primary/25",
    )}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">{label}</span>
        <div className="h-8 w-8 rounded-lg bg-accent/70 grid place-items-center text-accent-foreground border border-border/50">{icon}</div>
      </div>
      <div className={cn("text-2xl font-semibold font-display tracking-tight tabular-nums", tone === "primary" && "text-gradient")}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function EventChip({ ev, onClick }: { ev: DividendCalendarEvent; onClick: () => void }) {
  const c = eventColorClasses(ev.eventType, ev.status);
  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "w-full text-left rounded-md px-1.5 py-1 border text-[10px] font-semibold leading-tight",
            "hover:shadow-elegant transition-all hover:-translate-y-px",
            c.chip,
          )}
        >
          <div className="flex items-center gap-1">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
            <span className="truncate">{ev.symbol}</span>
          </div>
          <div className="text-[10px] opacity-90 tabular-nums">PKR {shortAmount(ev.grossDividend)}</div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex items-center gap-2">
          <StockLogo symbol={ev.symbol} size={28} />
          <div>
            <div className="font-semibold text-sm">{ev.symbol}</div>
            <div className="text-[10px] text-muted-foreground">{ev.company}</div>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Gross</div>
            <div className="font-semibold tabular-nums">{pkr(ev.grossDividend)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Event</div>
            <div className="font-medium">{EVENT_LABEL[ev.eventType]}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Date</div>
            <div className="font-medium">{fmtDateShort(ev.eventDate)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">Status</div>
            <div className="font-medium capitalize">{ev.status.toLowerCase()}</div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function AgendaView({
  events, eventType, onSelect,
}: {
  events: DividendCalendarEvent[];
  eventType: DividendEventType;
  onSelect: (ev: DividendCalendarEvent) => void;
}) {
  const sorted = [...events].sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1));
  return (
    <Card className="card-elevated">
      <CardHeader className="py-3 border-b">
        <CardTitle className="text-sm">Agenda · {EVENT_LABEL[eventType]}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y">
        {sorted.map((ev) => {
          const c = eventColorClasses(ev.eventType, ev.status);
          return (
            <button
              key={`${ev.symbol}-${ev.eventDate}`}
              onClick={() => onSelect(ev)}
              className="w-full text-left flex items-center gap-3 p-3 hover:bg-accent/40 transition"
            >
              <StockLogo symbol={ev.symbol} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{ev.symbol}</span>
                  <Badge variant="outline" className={cn("text-[10px]", c.chip)}>{EVENT_LABEL[ev.eventType]}</Badge>
                </div>
                <div className="text-xs text-muted-foreground truncate">{ev.company}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums">{pkr(ev.grossDividend)}</div>
                <div className="text-[10px] text-muted-foreground">{fmtDateShort(ev.eventDate)}</div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <Card className="card-elevated">
      <CardContent className="p-12 text-center">
        <div className="h-14 w-14 rounded-2xl bg-accent grid place-items-center mx-auto mb-4">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-base font-semibold">No dividend events found for this month.</div>
        <p className="text-sm text-muted-foreground mt-1">Try navigating to a different month or adjusting your filters.</p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onPrev}><ChevronLeft className="h-4 w-4 mr-1" />Previous Month</Button>
          <Button variant="outline" size="sm" onClick={onNext}>Next Month<ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      <span className="text-xs text-foreground/80">{label}</span>
    </div>
  );
}

function EventDetails({ ev }: { ev: DividendCalendarEvent }) {
  const c = eventColorClasses(ev.eventType, ev.status);
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <StockLogo symbol={ev.symbol} size={44} />
          <div className="min-w-0">
            <SheetTitle className="text-lg">{ev.symbol}</SheetTitle>
            <SheetDescription className="truncate">{ev.company} · {ev.sector}</SheetDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className={cn("text-[10px]", c.chip)}>{EVENT_LABEL[ev.eventType]}</Badge>
          <Badge variant="outline" className="text-[10px] capitalize">{ev.status.toLowerCase()}</Badge>
          <Badge variant="outline" className="text-[10px]">{ev.portfolioName}</Badge>
        </div>
      </SheetHeader>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <Metric label="Dividend / Share" value={`PKR ${ev.dividendPerShare.toFixed(2)}`} />
        <Metric label="Eligible Shares" value={ev.eligibleShares.toLocaleString()} />
        <Metric label="Gross Dividend" value={pkr(ev.grossDividend)} />
        <Metric label="Tax" value={pkr(ev.tax)} />
        <Metric label="Net Dividend" value={pkr(ev.netDividend)} accent />
        <Metric label="Holding Value" value={pkr(ev.holdingValue)} />
      </div>

      <Separator className="my-6" />

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</div>
        <TimelineRow icon={<span className="h-2 w-2 rounded-full bg-violet-500" />} label="Announcement" date={ev.announcementDate} />
        <TimelineRow icon={<span className="h-2 w-2 rounded-full bg-sky-500" />} label="Ex-Date" date={ev.exDate} />
        <TimelineRow icon={<span className="h-2 w-2 rounded-full bg-amber-500" />} label="Book Closure" date={`${fmtDate(ev.bookClosureStart)} – ${fmtDate(ev.bookClosureEnd)}`} raw />
        <TimelineRow icon={<span className="h-2 w-2 rounded-full bg-emerald-500" />} label="Payment" date={ev.paymentDate} />
      </div>

      <Separator className="my-6" />

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Current Yield" value={`${ev.currentYield.toFixed(2)}%`} />
        <Metric label="Yield on Cost" value={`${ev.yieldOnCost.toFixed(2)}%`} />
      </div>

      <div className="flex items-center gap-2 mt-6">
        <Button variant="outline" className="flex-1" size="sm">
          <TrendingUp className="h-4 w-4 mr-1.5" />View Holding
        </Button>
        <Button variant="outline" className="flex-1" size="sm">
          <Coins className="h-4 w-4 mr-1.5" />Dividend History
        </Button>
      </div>
    </>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border bg-card/60 p-3">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums mt-1", accent && "text-success")}>{value}</div>
    </div>
  );
}

function TimelineRow({ icon, label, date, raw }: { icon: React.ReactNode; label: string; date: string; raw?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-full bg-accent/50 grid place-items-center">{icon}</div>
      <div className="flex-1 flex items-center justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium tabular-nums">{raw ? date : fmtDate(date)}</span>
      </div>
    </div>
  );
}
