import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dividendEvents } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
  head: () => ({ meta: [{ title: "Dividend Calendar — PSX Dividend Tracker" }] }),
});

function CalendarPage() {
  const daysInMonth = 31;
  const firstDay = 3; // Wed start
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null as number | null),
    ...Array.from({ length: daysInMonth }, (_, i) => (i + 1) as number | null),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const events = new Map(dividendEvents.map((e) => [e.day, e]));

  return (
    <>
      <PageHeader title="Dividend Calendar" description="July 2026"
        actions={<div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="h-8">Today</Button>
          <Button variant="outline" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
        </div>} />

      <Card className="card-elevated">
        <CardHeader className="border-b">
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-[11px] font-medium text-muted-foreground uppercase text-center tracking-wider">{d}</div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              const ev = d ? events.get(d) : null;
              return (
                <div key={i} className={`aspect-square rounded-xl border p-2 flex flex-col ${d ? "bg-card hover:bg-accent/30" : "bg-muted/20 border-transparent"} transition`}>
                  {d && (
                    <>
                      <div className="text-xs font-medium text-muted-foreground">{d}</div>
                      {ev && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <button className="mt-auto text-left w-full rounded-md p-1.5 gradient-primary text-white text-[10px] font-semibold shadow-glow">
                              <div className="truncate">{ev.symbol}</div>
                              <div className="text-[9px] opacity-90">PKR {ev.amount}</div>
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <div className="font-semibold text-sm">{ev.symbol}</div>
                            <div className="text-xs text-muted-foreground mt-1">Dividend PKR {ev.amount}/share</div>
                            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                              <div><div className="text-muted-foreground">Book Closure</div><div className="font-medium">Jul {ev.day}, 2026</div></div>
                              <div><div className="text-muted-foreground">Ex-Date</div><div className="font-medium">Jul {ev.day - 2}, 2026</div></div>
                              <div><div className="text-muted-foreground">Payment</div><div className="font-medium">Jul {ev.day + 10}, 2026</div></div>
                              <div><div className="text-muted-foreground">Your Est.</div><div className="font-medium text-success">+PKR 4,200</div></div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated mt-6">
        <CardHeader><CardTitle className="text-base">This Month's Events</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {dividendEvents.map((e) => (
            <div key={e.symbol} className="flex items-center gap-3 rounded-xl border p-3 hover:shadow-elegant transition">
              <div className="h-10 w-10 rounded-lg gradient-primary grid place-items-center text-white font-bold text-xs">{e.symbol.slice(0, 3)}</div>
              <div className="flex-1">
                <div className="text-sm font-medium">{e.symbol}</div>
                <div className="text-xs text-muted-foreground">Jul {e.day} · PKR {e.amount}/sh</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
