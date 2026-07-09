import { Bell, Search, Plus, Moon, Sun } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { notifications } from "@/lib/mock-data";
import { useState, useEffect } from "react";

export function AppTopbar() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-14 border-b glass-panel">
      <div className="flex h-full items-center gap-3 px-4">
        <SidebarTrigger />
        <div className="relative hidden md:flex flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search stocks, sectors, transactions…" className="pl-9 h-9 bg-muted/40 border-transparent focus-visible:bg-background" />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
        <div className="flex-1 md:hidden" />
        <Button size="sm" className="gap-1.5 h-9 hidden sm:inline-flex">
          <Plus className="h-4 w-4" /> Add Transaction
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold text-sm">Notifications</div>
              <Badge variant="secondary" className="text-[10px]">{unread} new</Badge>
            </div>
            <div className="max-h-80 overflow-auto divide-y">
              {notifications.map((n) => (
                <div key={n.id} className={`p-3 hover:bg-muted/40 transition ${n.unread ? "bg-accent/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`h-2 w-2 mt-1.5 rounded-full ${n.unread ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{n.type} · {n.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">AR</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-xs font-medium">Ali Raza</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">Ali Raza</span>
                <span className="text-xs text-muted-foreground font-normal">ali@example.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Broker Accounts</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
