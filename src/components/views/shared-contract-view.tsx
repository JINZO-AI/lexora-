"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import {
  Scale,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/shared/risk-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CONTRACT_TYPE_LABELS,
  CLAUSE_TYPE_LABELS,
  RISK_COLORS,
  formatDate,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SharedContractView() {
  const { shareToken } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }
    loadShared();
  }, [shareToken]);

  async function loadShared() {
    try {
      const res = await api.get<any>(`/api/contracts/shared/${shareToken}`);
      setData(res);
    } catch (err: any) {
      setError(err?.message || "Failed to load shared contract");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shared analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-semibold text-foreground">Link not available</h3>
            <p className="text-sm text-muted-foreground">{error || "This shared link is no longer valid."}</p>
            <Button className="mt-4" onClick={() => window.location.href = "/"}>
              Go to LEXORA
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto flex h-[68px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Scale className="h-5 w-5 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[17px] font-bold tracking-tight text-primary">LEXORA</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Shared Analysis
              </span>
            </div>
          </div>
          <Badge variant="secondary" className="text-[11px]">Read-only</Badge>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
        {/* Title */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {CONTRACT_TYPE_LABELS[data.contractType as keyof typeof CONTRACT_TYPE_LABELS] || data.contractType}
            </Badge>
            <span className="text-[12px] text-muted-foreground">
              Shared by {data.sharedBy} • Analyzed {formatDate(data.analyzedAt)}
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.028em] text-primary">{data.title}</h1>
        </div>

        {/* Risk score + summary */}
        <div className="grid gap-5 md:grid-cols-3 animate-slide-up stagger-1">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={data.riskLevel === "critical" ? "#dc2626" : data.riskLevel === "high" ? "#ea580c" : data.riskLevel === "medium" ? "#d97706" : "#16a34a"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - (data.riskScore || 0) / 100)}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-foreground">{data.riskScore}</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              {data.riskLevel && <RiskBadge level={data.riskLevel} />}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Contract Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[14px] leading-relaxed text-foreground/80">{data.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10.5px]">{data.pageCount || 0} pages</Badge>
                <Badge variant="outline" className="text-[10.5px]">{data.wordCount || 0} words</Badge>
                <Badge variant="outline" className="text-[10.5px]">{data.clauses?.length || 0} clauses</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Red flags */}
        {data.immediateRedFlags?.length > 0 && (
          <Card className="border-red-200 bg-red-50/50 animate-slide-up stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] text-red-900">
                <AlertTriangle className="h-4 w-4" />
                Immediate Red Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.immediateRedFlags.map((flag: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Missing clauses */}
        {data.missingClauses?.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 animate-slide-up stagger-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] text-amber-900">
                <ListChecks className="h-4 w-4" />
                Missing Important Clauses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.missingClauses.map((clause: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[13px]">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
                    <span>{clause}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Negotiation priorities */}
        {data.negotiationPriorities?.length > 0 && (
          <Card className="animate-slide-up stagger-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] text-foreground">
                <Lightbulb className="h-4 w-4 text-primary" />
                Negotiation Priorities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {data.negotiationPriorities.map((priority: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-[13px]">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span>{priority}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Clauses */}
        {data.clauses?.length > 0 && (
          <Card className="animate-slide-up stagger-5">
            <CardHeader>
              <CardTitle className="text-[15px] font-semibold tracking-tight text-foreground">
                Clauses ({data.clauses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue={data.clauses[0]?.id}>
                {data.clauses.map((clause: any) => {
                  const colors = RISK_COLORS[clause.riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.attention;
                  return (
                    <AccordionItem key={clause.id} value={clause.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 pr-2 text-left">
                          <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold", colors.bg, colors.text)}>
                            {clause.riskScore}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[14px] text-foreground">{clause.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {CLAUSE_TYPE_LABELS[clause.clauseType] || clause.clauseType}
                            </p>
                          </div>
                          <RiskBadge level={clause.riskLevel} size="sm" />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Plain English</p>
                            <p className="text-[13px] leading-relaxed text-foreground/80">{clause.plainEnglish}</p>
                          </div>
                          <div className={cn("rounded-lg p-3", colors.bg)}>
                            <p className="text-[11px] font-semibold mb-1" style={{ color: colors.hex }}>Why it matters</p>
                            <p className="text-[13px] leading-relaxed text-foreground/80">{clause.riskExplanation}</p>
                          </div>
                          {clause.industryStandardClause && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                              <p className="text-[11px] font-semibold text-emerald-800 mb-1">Industry Standard</p>
                              <p className="text-[13px] leading-relaxed text-foreground/80">{clause.industryStandardClause}</p>
                            </div>
                          )}
                          {clause.suggestedCounterProposal && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                              <p className="text-[11px] font-semibold text-primary mb-1">Suggested Counter-Proposal</p>
                              <p className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-wrap">{clause.suggestedCounterProposal}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* CTA footer */}
        <Card className="border-primary/30 bg-primary/5 animate-slide-up stagger-6">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="mb-2 text-[20px] font-bold tracking-tight text-foreground">Want to analyze your own contracts?</h3>
            <p className="mb-5 max-w-md text-[14px] text-muted-foreground">
              LEXORA uses AI to identify risky clauses, explain legal jargon, and generate counter-proposals in seconds.
            </p>
            <Button variant="default" size="lg" onClick={() => window.location.href = "/"} className="gap-2">
              Try LEXORA Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
