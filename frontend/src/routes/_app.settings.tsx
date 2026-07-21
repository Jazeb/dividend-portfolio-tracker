import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { profileApi, type Profile, type UpdateProfileDto } from "@/lib/api/profile";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — PSX Dividend Tracker" }] }),
});

const API_ENABLED = Boolean((import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim());

const SEED_PROFILE: Profile = {
  id: "seed-user",
  firstName: "Ali",
  lastName: "Raza",
  email: "ali@example.com",
  phone: "+92 300 1234567",
  country: "Pakistan",
  city: "Karachi",
};

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
          <ProfileCard />
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

function ProfileCard() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.get(),
    enabled: API_ENABLED,
    initialData: API_ENABLED ? undefined : SEED_PROFILE,
    placeholderData: SEED_PROFILE,
    staleTime: 60_000,
  });

  const profile: Profile = profileQuery.data ?? SEED_PROFILE;
  const isLoading = API_ENABLED && profileQuery.isLoading;
  const isError = API_ENABLED && profileQuery.isError && !profileQuery.data;

  const [form, setForm] = useState<UpdateProfileDto>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    country: profile.country,
    city: profile.city,
  });

  useEffect(() => {
    if (profileQuery.data) {
      const p = profileQuery.data;
      setForm({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        country: p.country ?? "",
        city: p.city ?? "",
      });
    }
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (dto: UpdateProfileDto): Promise<Profile> => {
      if (!API_ENABLED) {
        const updated: Profile = { ...profile, ...dto };
        queryClient.setQueryData<Profile>(["profile"], updated);
        return updated;
      }
      return profileApi.update(dto);
    },
    onSuccess: () => {
      if (API_ENABLED) queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update profile"),
  });

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <p className="text-sm text-destructive">Failed to load profile.</p>
            <Button variant="outline" size="sm" onClick={() => profileQuery.refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Upload photo</Button>
                <p className="text-xs text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Pakistan" className="mt-1.5" />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Karachi" className="mt-1.5" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const p = profileQuery.data ?? SEED_PROFILE;
                  setForm({
                    firstName: p.firstName,
                    lastName: p.lastName,
                    email: p.email,
                    phone: p.phone,
                    country: p.country ?? "",
                    city: p.city ?? "",
                  });
                }}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
