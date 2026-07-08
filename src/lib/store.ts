import { create } from "zustand";
import type { ViewName } from "@/lib/types";

interface AppState {
  // View routing (client-side SPA navigation)
  view: ViewName;
  contractId: string | null;
  templateId: string | null;
  shareToken: string | null;

  // User session (client cache)
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    subscriptionPlan: string;
    companyName?: string | null;
  } | null;

  // UI state
  sidebarOpen: boolean;

  // Actions
  navigate: (view: ViewName, opts?: { contractId?: string; templateId?: string; shareToken?: string }) => void;
  setUser: (user: AppState["user"]) => void;
  clearUser: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "landing",
  contractId: null,
  templateId: null,
  shareToken: null,
  user: null,
  sidebarOpen: false,

  navigate: (view, opts) => {
    set({
      view,
      contractId: opts?.contractId ?? null,
      templateId: opts?.templateId ?? null,
      shareToken: opts?.shareToken ?? null,
      sidebarOpen: false,
    });
    // Scroll to top on navigation
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, view: "landing" }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
