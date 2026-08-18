import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, LogOut, PanelLeft, Users, Shield, AlertTriangle, Zap, BarChart3, FileText, Settings, Activity, Building2, Bell, TrendingUp, Filter, Sun, Moon } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: AlertTriangle, label: "Attack Forensics", path: "/forensics" },
  { icon: Zap, label: "Mitigation Controls", path: "/mitigation" },
  { icon: Shield, label: "Alerts & Notifications", path: "/alerts" },
  { icon: BarChart3, label: "Executive Summary", path: "/summary" },
  { icon: FileText, label: "Audit Logs", path: "/audit" },
  { icon: Activity, label: "Real-Time Updates", path: "/realtime" },
  { icon: Zap, label: "Attack Playbooks", path: "/playbooks" },
  { icon: Building2, label: "Organizations", path: "/organizations" },
  { icon: Filter, label: "Alert Rules Builder", path: "/alert-rules" },
  { icon: TrendingUp, label: "Threat Intelligence", path: "/threat-intelligence" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: Users, label: "User Management", path: "/users" },
  { icon: Settings, label: "System Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground drafting-grid relative">
      <div className="relative border-r border-border bg-sidebar" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0 bg-sidebar"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-border">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-[#c5a880]/10 border border-transparent hover:border-[#c5a880]/20 rounded-none transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-[#c5a880]" />
              </button>
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="h-8 w-8 flex items-center justify-center hover:bg-[#c5a880]/10 border border-transparent hover:border-[#c5a880]/20 rounded-none transition-colors focus:outline-none shrink-0"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-[#c5a880]" />
                  ) : (
                    <Moon className="h-4 w-4 text-[#c5a880]" />
                  )}
                </button>
              )}
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-serif text-[10px] tracking-widest text-[#c5a880] uppercase">
                    Sentinel Controls
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 rounded-none font-mono text-[10px] uppercase tracking-wider transition-all ${
                        isActive
                          ? "border border-[#c5a880]/30 bg-[#c5a880]/10 text-[#c5a880]"
                          : "hover:bg-[#c5a880]/5 text-muted-foreground hover:text-[#e2e8f0]"
                      }`}
                    >
                      <item.icon
                        className={`h-3.5 w-3.5 ${isActive ? "text-[#c5a880]" : "text-muted-foreground"}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-[#c5a880]/10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-none border border-transparent hover:border-[#c5a880]/20 px-1 py-1 hover:bg-[#c5a880]/5 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border border-[#c5a880]/35 shrink-0 rounded-none bg-[#13151a]">
                    <AvatarFallback className="text-[10px] font-mono font-medium text-[#c5a880] rounded-none">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-mono uppercase tracking-wider truncate leading-none text-[#e2e8f0]">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-none border-[#c5a880]/20 bg-[#13151a]">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive font-mono text-xs uppercase"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#c5a880]/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-transparent">
        {isMobile && (
          <div className="flex border-b border-[#c5a880]/15 h-14 items-center justify-between bg-[#0c0d10] px-2 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-none bg-[#13151a] border border-[#c5a880]/25 text-[#c5a880]" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-xs uppercase tracking-widest text-[#c5a880]">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-6 relative">{children}</main>
      </SidebarInset>
    </div>
  );
}
