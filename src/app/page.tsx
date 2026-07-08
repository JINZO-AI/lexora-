"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { AppShell } from "@/components/app/app-shell";
import { LandingView } from "@/components/views/landing-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { ContractListView } from "@/components/views/contract-list-view";
import { ContractUploadView } from "@/components/views/contract-upload-view";
import { ContractAnalysisView } from "@/components/views/contract-analysis-view";
import { TemplatesView, TemplateBuilderView } from "@/components/views/templates-view";
import { AgentTerminalView } from "@/components/views/agent-terminal-view";
import { SettingsView } from "@/components/views/settings-view";
import { BillingView } from "@/components/views/billing-view";
import { SharedContractView } from "@/components/views/shared-contract-view";
import { AdminSettingsView } from "@/components/views/admin-settings-view";
import {
  AdminDashboardView,
  AdminUsersView,
  AdminContractsView,
} from "@/components/views/admin-views";
import type { ViewName } from "@/lib/types";

export default function Home() {
  const { user, view, setUser, navigate } = useAppStore();
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing session on mount + handle share URL
  useEffect(() => {
    async function checkSession() {
      // Check for share token in URL (?share=TOKEN)
      const urlParams = new URLSearchParams(window.location.search);
      const shareToken = urlParams.get("share");
      if (shareToken) {
        navigate("shared", { shareToken });
        setCheckingSession(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json();
        if (data?.user) {
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            subscriptionPlan: data.user.subscriptionPlan,
          });
          // If on landing, go to dashboard
          if (useAppStore.getState().view === "landing") {
            navigate("dashboard");
          }
        }
      } catch {
        // Not logged in, stay on landing
      } finally {
        setCheckingSession(false);
      }
    }
    checkSession();
  }, [setUser, navigate]);

  // Show a minimal loading state while checking session
  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <svg className="h-6 w-6 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v18M3 12h18" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading LEXORA...</p>
        </div>
      </div>
    );
  }

  // Shared contract view (no auth required)
  if (view === "shared") {
    return <SharedContractView />;
  }

  // Not logged in — show landing page
  if (!user) {
    return <LandingView />;
  }

  // Logged in — show app shell with the active view
  return (
    <AppShell>
      <ViewRenderer view={view} />
    </AppShell>
  );
}

function ViewRenderer({ view }: { view: ViewName }) {
  switch (view) {
    case "landing":
      return <LandingView />;
    case "login":
    case "register":
      return <LandingView />;
    case "dashboard":
      return <DashboardView />;
    case "contracts":
      return <ContractListView />;
    case "contract-new":
      return <ContractUploadView />;
    case "contract-view":
      return <ContractAnalysisView />;
    case "templates":
      return <TemplatesView />;
    case "template-new":
      return <TemplateBuilderView />;
    case "agent-terminal":
      return <AgentTerminalView />;
    case "settings":
      return <SettingsView />;
    case "billing":
      return <BillingView />;
    case "admin-dashboard":
      return <AdminDashboardView />;
    case "admin-users":
      return <AdminUsersView />;
    case "admin-contracts":
      return <AdminContractsView />;
    case "admin-settings":
      return <AdminSettingsView />;
    default:
      return <DashboardView />;
  }
}
