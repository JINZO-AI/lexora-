"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Library,
  Settings,
  Shield,
  Users,
  BarChart3,
  Bell,
  Menu,
  LogOut,
  Sparkles,
  Terminal,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ViewName } from "@/lib/types";

interface NavItem {
  view: ViewName;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "contracts", label: "Contracts", icon: FileText },
  { view: "templates", label: "Templates", icon: Library },
  { view: "agent-terminal", label: "AI Terminal", icon: Terminal },
  { view: "settings", label: "Organization", icon: Settings },
];

const adminItems: NavItem[] = [
  { view: "admin-dashboard", label: "Analytics", icon: BarChart3, adminOnly: true },
  { view: "admin-users", label: "Users", icon: Users, adminOnly: true },
  { view: "admin-contracts", label: "All Contracts", icon: Shield, adminOnly: true },
  { view: "admin-settings", label: "Admin Settings", icon: Settings, adminOnly: true },
];

const viewMeta: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Monitor contracts, risk, and AI activity in one place." },
  contracts: { title: "Contracts", subtitle: "Search, filter, and manage every uploaded agreement." },
  "contract-new": { title: "Upload Contract", subtitle: "Upload documents for automated risk analysis." },
  "contract-view": { title: "Contract analysis", subtitle: "Review clause-level legal risk with AI-generated guidance." },
  templates: { title: "Template builder", subtitle: "Create reusable contract templates with smart placeholders." },
  "template-new": { title: "Create Template", subtitle: "Create reusable contract templates with smart placeholders." },
  "agent-terminal": { title: "AI Terminal", subtitle: "Real-time visualization of multi-agent AI consensus protocol." },
  settings: { title: "Settings", subtitle: "Manage your account and preferences." },
  billing: { title: "Billing & Subscription", subtitle: "Choose the plan that fits your business." },
  "admin-dashboard": { title: "Admin panel", subtitle: "Track users, AI usage, and platform-wide contract analytics." },
  "admin-users": { title: "User Management", subtitle: "Manage user accounts and permissions." },
  "admin-contracts": { title: "All Contracts", subtitle: "View all contracts across the platform." },
  "admin-settings": { title: "Admin Settings", subtitle: "Configure AI, plans, and maintenance mode." },
};

interface Notification {
  id: string; title: string; body: string; isRead: boolean; actionUrl: string | null; createdAt: string;
}

interface SidebarContentProps {
  user: { name?: string | null; email?: string | null; subscriptionPlan?: string; role?: string } | null;
  view: ViewName;
  navigate: (view: ViewName, opts?: { contractId?: string; templateId?: string; shareToken?: string }) => void;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ user, view, navigate, onLogout, onNavigate }: SidebarContentProps) {
  const isAdmin = user?.role === "admin";
  const allItems = [...navItems, ...(isAdmin ? adminItems : [])];
  const initials = (user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();

  return (
    <aside
      className="sticky top-0 h-screen p-[var(--space-6)] bg-[var(--color-surface)] border-r border-[rgba(0,0,0,0.08)] flex flex-col gap-[var(--space-6)]"
      style={{ width: "var(--sidebar-w)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-[var(--space-3)]">
        <div className="brand-mark shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 5h6v2H7v10h10v-4h2v6H5V5Z" fill="currentColor"/>
            <path d="M13 5h6v6h-2V8.41l-6.29 6.3-1.42-1.42L15.59 7H13V5Z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <div className="font-[var(--font-display)] text-[1.3rem] font-semibold tracking-[-0.03em]">LEXORA</div>
          <div className="text-[var(--text-xs)] text-[var(--color-text-muted)]">AI contract intelligence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-[var(--space-2)]">
        {navItems.map((item) => {
          const isActive = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => { navigate(item.view); onNavigate?.(); }}
              className={`flex items-center gap-[var(--space-3)] p-[0.9rem_1rem] rounded-[var(--radius-lg)] text-left transition-all duration-150 ${
                isActive
                  ? "bg-[var(--color-surface-offset)] text-[var(--color-text)] font-medium"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full bg-current opacity-65 ${isActive ? "visible" : "invisible"}`} />
              <span className="text-[var(--text-sm)]">{item.label}</span>
            </button>
          );
        })}

        {isAdmin && (
          <>
            <div className="mt-[var(--space-4)] mb-[var(--space-2)] px-[1rem] text-[var(--text-xs)] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Administration
            </div>
            {adminItems.map((item) => {
              const isActive = view === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => { navigate(item.view); onNavigate?.(); }}
                  className={`flex items-center gap-[var(--space-3)] p-[0.9rem_1rem] rounded-[var(--radius-lg)] text-left transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--color-surface-offset)] text-[var(--color-text)] font-medium"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-offset)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full bg-current opacity-65 ${isActive ? "visible" : "invisible"}`} />
                  <span className="text-[var(--text-sm)]">{item.label}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Groq AI Status Card */}
      <div className="mt-auto p-[var(--space-5)] rounded-[var(--radius-xl)] bg-gradient-to-b from-[rgba(1,105,111,0.12)] to-transparent bg-[var(--color-surface-offset)] border border-[rgba(1,105,111,0.16)]">
        <div className="flex items-center gap-2 mb-[var(--space-2)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <h3 className="text-[var(--text-sm)] font-bold">Groq AI status</h3>
        </div>
        <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] leading-[1.5] mb-[var(--space-4)]">
          Primary model online. Average contract analysis latency: 7.2 seconds.
        </p>
        <button
          onClick={() => { navigate("contract-new"); onNavigate?.(); }}
          className="w-full btn btn-primary"
        >
          Upload contract
        </button>
      </div>

      {/* User card */}
      <div className="flex items-center gap-[var(--space-3)] pt-[var(--space-2)] border-t border-[rgba(0,0,0,0.06)]">
        <div className="avatar !w-9 !h-9 text-[var(--text-sm)]">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[var(--text-sm)] font-medium truncate">{user?.name || user?.email}</div>
          <div className="text-[var(--text-xs)] text-[var(--color-text-muted)] capitalize truncate">{user?.subscriptionPlan} plan</div>
        </div>
        <button onClick={onLogout} className="text-[var(--color-text-muted)] hover:text-[var(--color-critical)] transition-colors p-1">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, view, navigate, clearUser, sidebarOpen, setSidebarOpen } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadNotifications() {
      try {
        const res = await api.get<{ notifications: Notification[]; unreadCount: number }>("/api/notifications");
        if (mounted) { setNotifications(res.notifications); setUnreadCount(res.unreadCount); }
      } catch {}
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [view]);

  async function markAllRead() {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.isRead) { try { await api.patch(`/api/notifications/${n.id}/read`); } catch {} }
    if (n.actionUrl?.startsWith("contract-view:")) navigate("contract-view", { contractId: n.actionUrl.split(":")[1] });
    else if (n.actionUrl) navigate(n.actionUrl as ViewName);
  }

  async function handleLogout() {
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfData = await csrfRes.json();
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken: csrfData.csrfToken, callbackUrl: "/" }),
        credentials: "include",
      });
    } catch {}
    clearUser();
    if (typeof window !== "undefined") window.location.assign("/");
  }

  const initials = (user?.name?.charAt(0) || user?.email?.charAt(0) || "U").toUpperCase();
  const currentMeta = viewMeta[view] || { title: view, subtitle: "" };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased grid grid-cols-[var(--sidebar-w)_1fr] max-[1180px]:grid-cols-[92px_1fr] max-[840px]:grid-cols-1">
      {/* Desktop sidebar */}
      <div className="max-[840px]:hidden">
        <SidebarContent user={user} view={view} navigate={navigate} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SidebarContent user={user} view={view} navigate={navigate} onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between p-[var(--space-5)_var(--space-6)] bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] backdrop-blur-[12px] border-b border-[rgba(0,0,0,0.06)] max-[840px]:p-[var(--space-4)]">
          <div className="flex items-center gap-3">
            <button className="hidden max-[840px]:flex icon-btn !w-10 !h-10" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-[var(--text-xl)] font-[var(--font-display)] tracking-[-0.03em] font-medium">{currentMeta.title}</h1>
              <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-0.5">{currentMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-[var(--space-3)]">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="icon-btn relative">
                  <Bell className="h-[18px] w-[18px] text-[var(--color-text-muted)]" strokeWidth={2} />
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--color-critical)] border-2 border-[var(--color-surface)]" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-[var(--radius-xl)] border-[rgba(0,0,0,0.08)] shadow-[var(--shadow-lg)]">
                <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-4 py-3">
                  <span className="text-[var(--text-sm)] font-semibold">Notifications</span>
                  {unreadCount > 0 && <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={markAllRead}>Mark all read</Button>}
                </div>
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="mx-auto mb-2 h-7 w-7 text-[var(--color-text-faint)]" />
                      <p className="text-[var(--text-sm)] text-[var(--color-text-muted)]">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <button key={n.id} onClick={() => handleNotificationClick(n)} className={`flex w-full flex-col gap-1 border-b border-[var(--color-divider)] px-4 py-3 text-left hover:bg-[var(--color-surface-offset)] ${!n.isRead ? "bg-[rgba(1,105,111,0.04)]" : ""}`}>
                        <div className="flex items-start gap-2">
                          {!n.isRead && <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />}
                          <div className="flex-1">
                            <p className="text-[var(--text-sm)] font-medium">{n.title}</p>
                            <p className="mt-0.5 text-[var(--text-xs)] text-[var(--color-text-muted)] line-clamp-2">{n.body}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="avatar cursor-pointer transition-transform hover:scale-105">{initials}</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 rounded-[var(--radius-xl)] border-[rgba(0,0,0,0.08)] shadow-[var(--shadow-lg)]">
                <DropdownMenuLabel className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="avatar !w-9 !h-9 !text-[var(--text-sm)]">{initials}</div>
                    <div className="flex flex-col">
                      <span className="text-[var(--text-sm)] font-medium">{user?.name || "User"}</span>
                      <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("settings")} className="text-[var(--text-sm)]"><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
                {user?.role === "admin" && <DropdownMenuItem onClick={() => navigate("admin-dashboard")} className="text-[var(--text-sm)]"><Shield className="mr-2 h-4 w-4" /> Admin Panel</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => navigate("contract-new")} className="text-[var(--text-sm)]"><Sparkles className="mr-2 h-4 w-4" /> New Analysis</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[var(--text-sm)] text-[var(--color-critical)]"><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Viewport */}
        <div className="p-[var(--space-6)] max-[840px]:p-[var(--space-4)] flex-1 pb-[100px] max-[840px]:pb-[120px]">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="hidden max-[840px]:flex fixed left-0 right-0 bottom-0 p-[0.7rem] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] backdrop-blur-[12px] border-t border-[rgba(0,0,0,0.08)] justify-around z-40">
        {navItems.map((item) => (
          <button key={item.view} onClick={() => navigate(item.view)} className={`flex flex-col items-center gap-1 text-[0.72rem] ${view === item.view ? "text-[var(--color-primary)] font-bold" : "text-[var(--color-text-muted)]"}`}>
            <item.icon className="h-5 w-5" />
            <span>{item.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
