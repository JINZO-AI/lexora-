"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import {
  ArrowLeft,
  Download,
  Star,
  Trash2,
  Loader2,
  AlertTriangle,
  FileText,
  Sparkles,
  CheckCircle2,
  Share2,
  FileDown,
  Copy,
  Bell,
  ChevronRight,
  Scale,
  RefreshCw,
  ShieldAlert,
  Lightbulb,
  ListChecks,
  X,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiskBadge } from "@/components/shared/risk-badge";
import { RiskGauge } from "@/components/shared/risk-gauge";
import { toast } from "sonner";
import {
  CONTRACT_TYPE_LABELS,
  CLAUSE_TYPE_LABELS,
  RISK_COLORS,
  formatDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Clause {
  id: string;
  clauseType: string;
  title: string;
  originalText: string;
  pageNumber: number | null;
  riskScore: number;
  riskLevel: string;
  riskExplanation: string;
  plainEnglish: string;
  industryStandardClause: string | null;
  suggestedCounterProposal: string | null;
  isReviewedByUser: boolean;
  userNote: string | null;
}

interface ContractDetail {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  contractType: string;
  riskScore: number | null;
  riskLevel: string | null;
  summary: string | null;
  missingClauses: string[] | null;
  negotiationPriorities: string[] | null;
  immediateRedFlags: string[] | null;
  pageCount: number | null;
  wordCount: number | null;
  language: string | null;
  analyzedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  isStarred: boolean;
  notes: string | null;
  clauses: Clause[];
}

export function ContractAnalysisView() {
  const { contractId, navigate } = useAppStore();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [activeClause, setActiveClause] = useState<string | null>(null);
  const [generatingClause, setGeneratingClause] = useState<string | null>(null);
  const [showDocPanel, setShowDocPanel] = useState(true);
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (contractId) loadContract();
  }, [contractId]);

  async function loadContract() {
    if (!contractId) return;
    setLoading(true);
    try {
      const res = await api.get<ContractDetail>(`/api/contracts/${contractId}`);
      setContract(res);
      if (res.clauses.length > 0) {
        setActiveClause(res.clauses[0].id);
      }
    } catch (err) {
      toast.error("Failed to load contract");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!contractId) return;
    setAnalyzing(true);
    try {
      const res = await api.post<ContractDetail>(`/api/contracts/${contractId}/analyze`);
      setContract(res);
      toast.success("Analysis complete!", {
        description: `Risk score: ${res.riskScore}/100 • ${res.clauses.length} clauses found`,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Analysis failed";
      toast.error("Analysis failed", { description: message });
      loadContract();
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStar() {
    if (!contractId) return;
    try {
      const res = await api.post<{ isStarred: boolean }>(`/api/contracts/${contractId}/star`);
      setContract((prev) => (prev ? { ...prev, isStarred: res.isStarred } : prev));
    } catch {
      toast.error("Failed to update star");
    }
  }

  async function handleDelete() {
    if (!contractId) return;
    try {
      await api.delete(`/api/contracts/${contractId}`);
      toast.success("Contract deleted");
      navigate("contracts");
    } catch {
      toast.error("Failed to delete contract");
    }
  }

  async function handleDownload() {
    if (!contractId) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contract?.fileName || "contract";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file");
    }
  }

  async function handleShare() {
    if (!contractId) return;
    setSharing(true);
    try {
      const res = await api.post<{ shareToken: string; shareUrl: string }>(`/api/contracts/${contractId}/share`);
      const fullUrl = `${window.location.origin}/?share=${res.shareToken}`;
      setShareUrl(fullUrl);
      setShareOpen(true);
      toast.success("Share link generated!");
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setSharing(false);
    }
  }

  async function handleRevokeShare() {
    if (!contractId) return;
    try {
      await api.delete(`/api/contracts/${contractId}/share`);
      setShareUrl(null);
      setShareOpen(false);
      toast.success("Share link revoked");
    } catch {
      toast.error("Failed to revoke share link");
    }
  }

  function copyShareLink() {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  }

  async function handleExportReport() {
    if (!contractId) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/report`, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (contract?.title || "contract").replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 50);
      a.download = `LEXORA_Report_${safeName}.html`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported!");
    } catch {
      toast.error("Failed to export report");
    }
  }

  async function handleSetReminder() {
    if (!contractId || !contract?.expiresAt) {
      toast.error("This contract has no expiry date set");
      return;
    }
    try {
      const expiry = new Date(contract.expiresAt);
      const remindAt = new Date(expiry.getTime() - 7 * 24 * 60 * 60 * 1000);
      await api.post(`/api/contracts/${contractId}/reminder`, {
        reminderType: "expiry",
        remindAt: remindAt.toISOString(),
        daysBefore: 7,
        channel: "in_app",
      });
      toast.success("Reminder set!", {
        description: `You'll be notified 7 days before expiry`,
      });
    } catch {
      toast.error("Failed to set reminder");
    }
  }

  async function handleClauseReviewed(clause: Clause) {
    try {
      await api.patch(`/api/contracts/${contractId}/clauses/${clause.id}`, {
        isReviewedByUser: !clause.isReviewedByUser,
      });
      setContract((prev) =>
        prev
          ? {
              ...prev,
              clauses: prev.clauses.map((c) =>
                c.id === clause.id ? { ...c, isReviewedByUser: !c.isReviewedByUser } : c
              ),
            }
          : prev
      );
    } catch {
      toast.error("Failed to update clause");
    }
  }

  function handleNoteChange(clause: Clause, note: string) {
    setContract((prev) =>
      prev
        ? {
            ...prev,
            clauses: prev.clauses.map((c) => (c.id === clause.id ? { ...c, userNote: note } : c)),
          }
        : prev
    );
    if (noteTimers.current[clause.id]) clearTimeout(noteTimers.current[clause.id]);
    noteTimers.current[clause.id] = setTimeout(async () => {
      try {
        await api.patch(`/api/contracts/${contractId}/clauses/${clause.id}`, { userNote: note });
      } catch {}
    }, 800);
  }

  async function handleGenerateCounterProposal(clause: Clause) {
    setGeneratingClause(clause.id);
    try {
      const res = await api.post<{ counter_proposal: string; reasoning: string; negotiation_tips: string[] }>(
        `/api/contracts/${contractId}/counter-proposal/${clause.id}`, {}
      );
      setContract((prev) =>
        prev
          ? {
              ...prev,
              clauses: prev.clauses.map((c) =>
                c.id === clause.id ? { ...c, suggestedCounterProposal: res.counter_proposal } : c
              ),
            }
          : prev
      );
      toast.success("Counter-proposal generated!");
    } catch (err) {
      toast.error("Failed to generate counter-proposal");
    } finally {
      setGeneratingClause(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Contract not found</p>
            <Button className="mt-4" onClick={() => navigate("contracts")}>Back to Contracts</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAnalyzed = contract.status === "analyzed";
  const isProcessing = contract.status === "processing" || analyzing;
  const isFailed = contract.status === "failed";

  const criticalCount = contract.clauses.filter(c => c.riskLevel === "critical").length;
  const warningCount = contract.clauses.filter(c => c.riskLevel === "warning").length;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-background/50 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("contracts")}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{contract.title}</h2>
              <p className="text-xs text-muted-foreground">
                {CONTRACT_TYPE_LABELS[contract.contractType as keyof typeof CONTRACT_TYPE_LABELS] || contract.contractType}
                {contract.expiresAt && ` • Expires ${formatDate(contract.expiresAt)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAnalyzed && (
              <>
                <Button variant="ghost" size="icon" onClick={handleExportReport} title="Export Report" className="hidden sm:flex">
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare} title="Share" disabled={sharing} className="hidden sm:flex">
                  {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                </Button>
                {contract.expiresAt && (
                  <Button variant="ghost" size="icon" onClick={handleSetReminder} title="Set Reminder" className="hidden sm:flex">
                    <Bell className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={handleStar} title="Star">
              <Star className={cn("h-4 w-4", contract.isStarred && "fill-amber-400 text-amber-400")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} title="Delete" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {isProcessing ? (
          <ProcessingView />
        ) : isFailed ? (
          <FailedView onRetry={handleAnalyze} message={contract.notes || "Analysis failed"} />
        ) : !isAnalyzed ? (
          <NotAnalyzedView onAnalyze={handleAnalyze} analyzing={analyzing} />
        ) : (
          <div className="flex h-full gap-6 overflow-hidden p-4 md:p-6">
            {/* Left: Document Viewer */}
            {showDocPanel && (
              <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden">
                <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 bg-background/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h2 className="font-semibold tracking-tight text-sm">{contract.fileName}</h2>
                    <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md">
                      {contract.pageCount || 1} pages
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowDocPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
                  <div className="max-w-2xl mx-auto space-y-3">
                    {contract.clauses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No clauses detected.</p>
                    ) : (
                      contract.clauses.map((clause) => {
                        const colors = RISK_COLORS[clause.riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.medium;
                        const isActive = activeClause === clause.id;
                        return (
                          <div
                            key={clause.id}
                            className={cn(
                              "rounded-lg border-l-[3px] p-3 transition-all cursor-pointer",
                              colors.bg,
                              isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            )}
                            style={{ borderLeftColor: colors.hex }}
                            onClick={() => setActiveClause(clause.id)}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase" style={{ color: colors.hex }}>
                                {CLAUSE_TYPE_LABELS[clause.clauseType] || clause.clauseType}
                              </span>
                              <RiskBadge level={clause.riskLevel as any} size="sm" />
                            </div>
                            <p className="text-xs leading-relaxed text-foreground/80 line-clamp-4">
                              {clause.originalText}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">Page {clause.pageNumber || 1}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Right: AI Analysis Panel */}
            <div className="w-full lg:w-[450px] shrink-0 flex flex-col gap-4 overflow-y-auto scrollbar-thin pb-6">
              {/* Top Score Card */}
              <div className="glass-panel p-6 rounded-2xl border-t-[3px] border-t-destructive shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Scale className="h-24 w-24" />
                </div>
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h1 className="text-xl font-bold mb-1">Risk Assessment</h1>
                    <p className="text-sm text-muted-foreground">{contract.title}</p>
                  </div>
                  {contract.riskLevel && <RiskBadge level={contract.riskLevel as any} />}
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <RiskGauge score={contract.riskScore || 0} />
                  <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Critical Flags</span>
                      <span className="font-bold text-destructive">{criticalCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Warnings</span>
                      <span className="font-bold text-amber-500">{warningCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Clauses</span>
                      <span className="font-bold text-primary">{contract.clauses.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {contract.summary && (
                <div className="glass-panel p-4 rounded-xl">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Summary</p>
                  <p className="text-sm leading-relaxed text-foreground/90">{contract.summary}</p>
                </div>
              )}

              {/* Red flags */}
              {contract.immediateRedFlags && contract.immediateRedFlags.length > 0 && (
                <div className="glass-panel p-4 rounded-xl border-l-[3px] border-destructive">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Immediate Red Flags</p>
                  </div>
                  <ul className="space-y-2">
                    {contract.immediateRedFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Negotiation priorities */}
              {contract.negotiationPriorities && contract.negotiationPriorities.length > 0 && (
                <div className="glass-panel p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Negotiation Priorities</p>
                  </div>
                  <ol className="space-y-2">
                    {contract.negotiationPriorities.map((priority, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <span>{priority}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Clause Accordions */}
              <div className="mt-2 space-y-3">
                <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground px-1">Flagged Clauses</h3>
                <Accordion
                  type="single"
                  collapsible
                  value={activeClause || ""}
                  onValueChange={setActiveClause}
                >
                  {contract.clauses.map((clause) => {
                    const colors = RISK_COLORS[clause.riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.medium;
                    return (
                      <AccordionItem key={clause.id} value={clause.id} className="glass-panel rounded-xl overflow-hidden border mb-3 border-border/50">
                        <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-secondary/50">
                          <div className="flex items-center gap-3 pr-2">
                            <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold", colors.bg, colors.text)}>
                              {clause.riskScore}
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium">{clause.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {CLAUSE_TYPE_LABELS[clause.clauseType] || clause.clauseType}
                              </p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Tabs defaultValue="plain" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-none border-b border-border/50 bg-card/30">
                              <TabsTrigger value="plain" className="text-[11px]">Plain English</TabsTrigger>
                              <TabsTrigger value="original" className="text-[11px]">Original</TabsTrigger>
                              <TabsTrigger value="standard" className="text-[11px]">Market Standard</TabsTrigger>
                              <TabsTrigger value="proposal" className="text-[11px]">Proposal</TabsTrigger>
                            </TabsList>

                            <TabsContent value="plain" className="p-4 space-y-3">
                              <div className="rounded-md bg-muted/40 p-3">
                                <p className="text-xs font-semibold text-emerald-400 mb-1">What this actually means:</p>
                                <p className="text-sm leading-relaxed text-muted-foreground">{clause.plainEnglish}</p>
                              </div>
                              <div className={cn("rounded-md p-3", colors.bg)}>
                                <p className="text-xs font-semibold mb-1" style={{ color: colors.hex }}>Why it matters:</p>
                                <p className="text-sm leading-relaxed text-foreground/80">{clause.riskExplanation}</p>
                              </div>
                            </TabsContent>

                            <TabsContent value="original" className="p-4">
                              <div className="rounded-md border p-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                  Original clause (page {clause.pageNumber || 1})
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                                  {clause.originalText}
                                </p>
                              </div>
                            </TabsContent>

                            <TabsContent value="standard" className="p-4">
                              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                                <p className="text-xs font-semibold text-emerald-500 mb-2">Market Standard:</p>
                                {clause.industryStandardClause ? (
                                  <p className="text-sm leading-relaxed">{clause.industryStandardClause}</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No industry standard provided.</p>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="proposal" className="p-4 space-y-3">
                              {clause.suggestedCounterProposal ? (
                                <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-primary">Suggested Counter-Proposal:</p>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => copyToClipboard(clause.suggestedCounterProposal!)}>
                                      <Copy className="mr-1 h-3 w-3" /> Copy
                                    </Button>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{clause.suggestedCounterProposal}</p>
                                  <Button variant="outline" size="sm" className="mt-3" onClick={() => handleGenerateCounterProposal(clause)} disabled={generatingClause === clause.id}>
                                    {generatingClause === clause.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                                    Regenerate
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center rounded-md border border-dashed p-6 text-center">
                                  <Sparkles className="mb-2 h-6 w-6 text-primary" />
                                  <p className="mb-3 text-sm text-muted-foreground">Generate an AI counter-proposal</p>
                                  <Button onClick={() => handleGenerateCounterProposal(clause)} disabled={generatingClause === clause.id}>
                                    {generatingClause === clause.id ? (
                                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                                    ) : (
                                      <><Sparkles className="mr-2 h-4 w-4" />Generate</>
                                    )}
                                  </Button>
                                </div>
                              )}
                            </TabsContent>
                          </Tabs>

                          {/* Note + review */}
                          <div className="mt-3 space-y-3 border-t border-border/50 p-4">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground block mb-1">Your notes</label>
                              <Textarea
                                placeholder="Add your notes about this clause..."
                                value={clause.userNote || ""}
                                onChange={(e) => handleNoteChange(clause, e.target.value)}
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                            <Button
                              variant={clause.isReviewedByUser ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleClauseReviewed(clause)}
                            >
                              <CheckCircle2 className="mr-2 h-3 w-3" />
                              {clause.isReviewedByUser ? "Reviewed" : "Mark as reviewed"}
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>

              {/* Re-analyze */}
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Re-analyze Contract
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{contract.title}" and all its analysis data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Contract Analysis
            </DialogTitle>
            <DialogDescription>Anyone with this link can view the analysis (read-only).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareUrl || ""} readOnly className="font-mono text-xs" />
              <Button variant="default" onClick={copyShareLink} className="flex-shrink-0 gap-2">
                <Copy className="h-4 w-4" /> Copy
              </Button>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleRevokeShare} className="text-destructive gap-2">
                <Trash2 className="h-4 w-4" /> Revoke
              </Button>
              <Button variant="default" onClick={() => setShareOpen(false)} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProcessingView() {
  const steps = [
    { label: "Initializing OCR Engine", icon: FileText, agent: "Lex-Parser-Alpha" },
    { label: "Extracting clauses and entities", icon: FileText, agent: "Lex-Parser-Alpha" },
    { label: "Cross-referencing legal library", icon: Sparkles, agent: "Risk-Sentinel-V2" },
    { label: "Calculating financial exposure", icon: AlertTriangle, agent: "Quant-Oracle" },
    { label: "Generating risk assessment", icon: CheckCircle2, agent: "Risk-Sentinel-V2" },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<{ agent: string; message: string; time: string; color: string }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((s) => {
        if (s < steps.length - 1) {
          const step = steps[s];
          const time = `00:0${s + 1}.${String(s * 15).padStart(2, "0")}`;
          const color = step.agent === "Lex-Parser-Alpha" ? "text-[var(--color-success)]" :
                        step.agent === "Risk-Sentinel-V2" ? "text-[var(--color-gold)]" : "text-[var(--color-blue)]";
          setLogs((prev) => [...prev, { agent: step.agent, message: step.label, time, color }]);
          return s + 1;
        }
        return s;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-2xl w-full glass-panel rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-card/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse" />
              <div className="h-10 w-10 bg-card border-2 border-primary rounded-xl flex items-center justify-center relative z-10">
                <Cpu className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Deliberation Engine Active</h3>
              <p className="text-xs text-muted-foreground">Multi-agent consensus protocol running...</p>
            </div>
          </div>
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </div>

        {/* Terminal log */}
        <div className="bg-[var(--color-surface-offset)] p-6 font-mono text-sm min-h-[200px] max-h-[300px] overflow-y-auto scrollbar-thin text-[var(--color-text)] border-y border-border/50">
          {logs.map((log, i) => (
            <div key={i} className="mb-2 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="text-[var(--color-text-muted)] shrink-0 w-16">[{log.time}]</span>
              <span className={log.color}>{log.agent}:</span>
              <span className="text-[var(--color-text)]">{log.message}</span>
            </div>
          ))}
          {currentStep < steps.length - 1 && (
            <div className="flex gap-3 items-center mt-2">
              <span className="text-[var(--color-text-muted)] w-16">[00:0{currentStep + 1}.x]</span>
              <span className="text-[var(--color-gold)]">{steps[currentStep].agent}:</span>
              <span className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          )}
        </div>

        {/* Step tracker */}
        <div className="p-4 border-t border-border/50 space-y-2">
          {steps.map((step, i) => (
            <div key={i} className={cn("flex items-center gap-3 p-2 rounded-lg transition-colors", i <= currentStep ? "bg-primary/5" : "opacity-40")}>
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-full",
                i < currentStep ? "bg-emerald-500/20 text-emerald-500" :
                i === currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {i < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                 i === currentStep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                 <step.icon className="h-3.5 w-3.5" />}
              </div>
              <span className={cn("text-xs", i <= currentStep && "font-medium")}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotAnalyzedView({ onAnalyze, analyzing }: { onAnalyze: () => void; analyzing: boolean }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md w-full glass-panel">
        <CardContent className="flex flex-col items-center pt-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Ready to analyze</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Click below to start AI analysis. We'll identify risky clauses, explain them in plain English, and suggest counter-proposals.
          </p>
          <Button onClick={onAnalyze} disabled={analyzing} size="lg" className="w-full">
            {analyzing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Starting...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Analyze Contract</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FailedView({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="max-w-md w-full glass-panel border-destructive/30">
        <CardContent className="flex flex-col items-center pt-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Analysis failed</h3>
          <p className="mb-6 text-sm text-muted-foreground">{message}</p>
          <Button onClick={onRetry} size="lg" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
