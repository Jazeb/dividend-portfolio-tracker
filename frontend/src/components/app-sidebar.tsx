import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Wallet, PieChart, ArrowLeftRight, Coins, CalendarDays,
  BarChart3, Target, Rocket, Star, Filter, FileText, Settings, TrendingUp,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Portfolio", url: "/portfolio", icon: Wallet },
  { title: "Holdings", url: "/holdings", icon: PieChart },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Dividends", url: "/dividends", icon: Coins },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const planning = [
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Retirement Planner", url: "/retirement", icon: Rocket },
];

const discover = [
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "Stock Screener", url: "/screener", icon: Filter },
  { title: "Reports", url: "/reports", icon: FileText },
];

const bottom = [{ title: "Settings", url: "/settings", icon: Settings }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  const renderGroup = (label: string, items: typeof nav) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title} className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium">
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b h-14 px-4 flex-row items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-primary grid place-items-center shadow-glow">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold tracking-tight truncate">PSX Dividend</span>
              <span className="text-[10px] text-muted-foreground truncate">Income Tracker</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Overview", nav)}
        {renderGroup("Planning", planning)}
        {renderGroup("Discover", discover)}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          {bottom.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
