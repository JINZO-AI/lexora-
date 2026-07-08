"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import {
  Plus,
  Search,
  FileText,
  Star,
  Download,
  Trash2,
  MoreVertical,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/shared/risk-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
  formatDate,
  formatBytes,
  daysUntil,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ContractListItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  contractType: string;
  status: string;
  language: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  summary: string | null;
  createdAt: string;
  analyzedAt: string | null;
  expiresAt: string | null;
  isStarred: boolean;
  clauseCount: number;
}

const RISK_FILTERS = [
  { value: "", label: "All" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function relativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 2) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d);
}

function getActionInfo(c: ContractListItem): { label: string; variant: "default" | "outline" } {
  if (c.status === "analyzed") return { label: "Open", variant: "outline" };
  if (c.status === "processing") return { label: "Processing", variant: "outline" };
  if (c.status === "failed") return { label: "Retry", variant: "outline" };
  return { label: "Analyze", variant: "default" };
}

export function ContractListView() {
  const navigate = useAppStore((s) => s.navigate);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [deleteTarget, setDeleteTarget] = useState<ContractListItem | null>(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (riskFilter) params.set("riskLevel", riskFilter);
      if (typeFilter) params.set("contractType", typeFilter);
      const res = await api.get<{ contracts: ContractListItem[] }>(
        `/api/contracts?${params.toString()}`
      );
      setContracts(res.contracts);
    } catch (err) {
      console.error("Load contracts error:", err);
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }, [search, riskFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(loadContracts, 300);
    return () => clearTimeout(timer);
  }, [loadContracts]);

  async function toggleStar(c: ContractListItem, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.post(`/api/contracts/${c.id}/star`);
      setContracts((prev) =>
        prev.map((p) => (p.id === c.id ? { ...p, isStarred: !p.isStarred } : p))
      );
    } catch {
      toast.error("Failed to update star");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/contracts/${deleteTarget.id}`);
      setContracts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Contract deleted");
    } catch {
      toast.error("Failed to delete contract");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleDownload(c: ContractListItem, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/contracts/${c.id}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = c.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file");
    }
  }

  const hasFilters = search || riskFilter || typeFilter;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h2 className="text-[28px] font-bold tracking-[-0.028em] text-primary">Contracts</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {contracts.length} {contracts.length === 1 ? "contract" : "contracts"} • AI-analyzed legal documents
          </p>
        </div>
        <Button variant="default" onClick={() => navigate("contract-new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload contract
        </Button>
      </div>

      {/* Search bar — premium */}
      <div className="relative animate-slide-up stagger-1">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/70" strokeWidth={2} />
        <Input
          placeholder="Search contracts, counterparties, clause types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-12 text-[14px]"
        />
      </div>

      {/* Filter pills — premium */}
      <div className="flex flex-wrap items-center gap-2 animate-slide-up stagger-2">
        {RISK_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setRiskFilter(f.value)}
            className={cn(
              "chip text-[12px] transition-all duration-200",
              riskFilter === f.value
                ? "active"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-border" />
        <select
          value={typeFilter || "all"}
          onChange={(e) => setTypeFilter(e.target.value === "all" ? "" : e.target.value)}
          className="chip text-[12px] font-medium text-muted-foreground outline-none transition-all hover:text-foreground cursor-pointer"
        >
          <option value="all">All Types</option>
          {CONTRACT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-[12px]"
              onClick={() => {
                setSearch("");
                setRiskFilter("");
                setTypeFilter("");
              }}
            >
              Clear filters
            </Button>
          )}
          <div className="flex rounded-lg border border-border bg-card shadow-xs">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <Card className="border-dashed animate-fade-in">
          <CardContent className="flex flex-col items-center py-24">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-xs">
              <FileText className="h-8 w-8 text-primary" strokeWidth={1.8} />
            </div>
            <h3 className="mb-2 text-[18px] font-semibold tracking-tight text-foreground">
              {hasFilters ? "No contracts match your filters" : "No contracts yet"}
            </h3>
            <p className="mb-6 text-center text-[14px] text-muted-foreground max-w-md">
              {hasFilters
                ? "Try adjusting or clearing your filters to find what you're looking for."
                : "Upload your first contract to get AI-powered risk analysis in seconds."}
            </p>
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setRiskFilter("");
                  setTypeFilter("");
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button variant="default" onClick={() => navigate("contract-new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Contract
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "card" ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((c, idx) => {
            const action = getActionInfo(c);
            const expiryDays = daysUntil(c.expiresAt);
            const hasExpiryWarning = expiryDays !== null && expiryDays >= 0 && expiryDays <= 30;
            return (
              <Card
                key={c.id}
                className={cn(
                  "card cursor-pointer animate-slide-up border-border/40 hover:border-primary/30 transition-colors",
                  `stagger-${Math.min(idx + 1, 6)}`
                )}
                onClick={() => navigate("contract-view", { contractId: c.id })}
              >
                <CardContent className="p-6">
                  {/* Top: type + lang + star */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-md text-[10px] font-semibold uppercase tracking-wider">
                        {CONTRACT_TYPE_LABELS[c.contractType as keyof typeof CONTRACT_TYPE_LABELS] || c.contractType}
                      </Badge>
                      {c.language && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {c.language}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleStar(c, e)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-xs transition-all hover:bg-secondary hover:scale-105"
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          c.isStarred ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "text-muted-foreground"
                        )}
                      />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="mb-2 line-clamp-1 text-[16px] font-semibold tracking-tight text-foreground">
                    {c.title}
                  </h3>

                  {/* Summary */}
                  <p className="mb-4 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                    {c.summary || `${formatBytes(c.fileSize)} • ${c.clauseCount} clauses detected`}
                  </p>

                  {/* Risk badge + expiry */}
                  <div className="mb-4 flex items-center gap-2">
                    {c.status === "analyzed" && c.riskLevel ? (
                      <RiskBadge level={c.riskLevel as any} size="sm" />
                    ) : c.status === "processing" ? (
                      <Badge variant="secondary" className="text-[10.5px]">
                        <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-gold)]" />
                        Analyzing
                      </Badge>
                    ) : c.status === "failed" ? (
                      <Badge variant="destructive" className="text-[10.5px]">Failed</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10.5px]">Not analyzed</Badge>
                    )}
                    {hasExpiryWarning && (
                      <Badge variant="outline" className="text-[10.5px] text-[var(--color-medium)]">
                        <Clock className="mr-1 h-3 w-3" />
                        {expiryDays}d left
                      </Badge>
                    )}
                  </div>

                  {/* Bottom: action + meta */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="text-[11px] text-muted-foreground">
                      {relativeTime(c.analyzedAt || c.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={action.variant}
                        className="h-8 gap-1.5 text-[11.5px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("contract-view", { contractId: c.id });
                        }}
                      >
                        {action.label === "Analyze" && <Sparkles className="h-3 w-3" />}
                        {action.label === "Open" && <ArrowRight className="h-3 w-3" />}
                        {action.label}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg shadow-md">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(c, e); }}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="card animate-fade-in border-border/40">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {contracts.map((c) => {
                const action = getActionInfo(c);
                return (
                  <div
                    key={c.id}
                    className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-secondary/60"
                    onClick={() => navigate("contract-view", { contractId: c.id })}
                  >
                    <button
                      onClick={(e) => toggleStar(c, e)}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-xs"
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          c.isStarred ? "fill-[var(--color-gold)] text-[var(--color-gold)]" : "text-muted-foreground"
                        )}
                      />
                    </button>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-foreground">{c.title}</p>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        {CONTRACT_TYPE_LABELS[c.contractType as keyof typeof CONTRACT_TYPE_LABELS] || c.contractType} • {formatBytes(c.fileSize)} • {relativeTime(c.createdAt)}
                      </p>
                    </div>
                    {c.status === "analyzed" && c.riskLevel ? (
                      <RiskBadge level={c.riskLevel as any} size="sm" />
                    ) : (
                      <Badge variant="outline" className="text-[10.5px] capitalize">{c.status}</Badge>
                    )}
                    <Button
                      size="sm"
                      variant={action.variant}
                      className="h-8 text-[11.5px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("contract-view", { contractId: c.id });
                      }}
                    >
                      {action.label}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">Delete contract?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              This will permanently delete "{deleteTarget?.title}" and all its analysis data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
