import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — PSX Dividend Tracker" }] }),
});

function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account, brokers, and preferences" />
      <Tabs defaultValue="profile" orientation="vertical" className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        <TabsList className="flex-col h-fit w-full items-stretch bg-transparent p-0 gap-1">
          {["Profile", "Security", "Broker Accounts", "Currency", "Theme", "Notifications", "Data Export", "Privacy", "Subscription"].map((s) => (
            <TabsTrigger key={s} value={s.toLowerCase().replace(/\s+/g, "-")} className="justify-start data-[state=active]:bg-accent data-[state=active]:shadow-none text-sm h-9 px-3">{s}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Card className="card-elevated">
            <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Your personal information</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-primary-foreground">AR</AvatarFallback></Avatar>
                <div><Button variant="outline" size="sm">Upload photo</Button><p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB</p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input defaultValue="Ali" className="mt-1.5" /></div>
                <div><Label>Last Name</Label><Input defaultValue="Raza" className="mt-1.5" /></div>
                <div><Label>Email</Label><Input defaultValue="ali@example.com" className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input defaultValue="+92 300 1234567" className="mt-1.5" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline">Cancel</Button><Button>Save Changes</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-0">
          <Card className="card-elevated">
            <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Choose what you get notified about</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {["Dividend Announcements", "Upcoming Payments", "Book Closure Reminders", "Portfolio Milestones", "Goal Achievements", "Corporate Actions", "Weekly Summary"].map((n) => (
                <div key={n} className="flex items-center justify-between py-2">
                  <div><div className="text-sm font-medium">{n}</div><div className="text-xs text-muted-foreground">Email and in-app</div></div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broker-accounts" className="mt-0">
          <Card className="card-elevated">
            <CardHeader><CardTitle>Broker Accounts</CardTitle><CardDescription>Connected trading accounts</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {["AKD Securities", "JS Global", "Arif Habib"].map((b) => (
                <div key={b} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-accent grid place-items-center text-xs font-bold">{b[0]}</div>
                    <div><div className="text-sm font-medium">{b}</div><div className="text-xs text-muted-foreground">CDC linked · Synced 2h ago</div></div></div>
                  <Badge variant="secondary">Connected</Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full">+ Connect New Broker</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {["security", "currency", "theme", "data-export", "privacy", "subscription"].map((k) => (
          <TabsContent key={k} value={k} className="mt-0">
            <Card className="card-elevated"><CardHeader><CardTitle className="capitalize">{k.replace("-", " ")}</CardTitle><CardDescription>Coming soon in a future release</CardDescription></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">Configure your {k.replace("-", " ")} preferences here.</p></CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
