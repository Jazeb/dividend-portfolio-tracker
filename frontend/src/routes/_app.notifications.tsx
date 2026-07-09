import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/mock-data";
import { Bell, Coins, Trophy, CalendarDays, Building2, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — PSX Dividend Tracker" }] }),
});

const iconFor: Record<string, typeof Bell> = { Dividend: Coins, Milestone: Trophy, Reminder: CalendarDays, Corporate: Building2, Goal: Trophy };

function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Stay on top of dividends and portfolio events"
        actions={<Button variant="outline" size="sm" className="gap-1.5"><CheckCheck className="h-4 w-4" />Mark all read</Button>} />
      <Card className="card-elevated overflow-hidden">
        <div className="divide-y">
          {notifications.map((n) => {
            const Icon = iconFor[n.type] ?? Bell;
            return (
              <div key={n.id} className={`flex items-start gap-4 p-4 hover:bg-muted/40 transition ${n.unread ? "bg-accent/20" : ""}`}>
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${n.unread ? "gradient-primary text-white shadow-glow" : "bg-accent text-accent-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{n.type}</Badge>
                    {n.unread && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <div className="text-sm font-medium mt-1">{n.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
