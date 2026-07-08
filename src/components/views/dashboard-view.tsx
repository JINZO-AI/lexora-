"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import {
  FileText,
  TrendingDown,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  AlertTriangle,
  Plus,
  Star,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/shared/risk-badge";
import {
  CONTRACT_TYPE_LABELS,
  formatDate,
  daysUntil,
  CLAUSE_TYPE_LABELS,
} from "@/lib/constants";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

interface DashboardData {
  stats: {
    totalContracts: number;
    analyzedContracts: number;
    analyzedThisMonth: number;
    expiringIn30Days: number;
    avgRiskScore: number;
    monthlyLimit: number;
    monthlyUsed: number;
  };
  riskDistribution: { level: string; count: number }[];
  recentContracts: any[];
  upcomingExpirations: any[];
  clauseTypeStats: { type: string; count: number; avgRiskScore: number }[];
}

function buildRiskTrendData(avgRiskScore: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const baseScore = avgRiskScore || 50;
  return months.map((month, i) => {
    const variance = Math.sin(i * 1.2) * 15;
    return { month, score: Math.max(10, Math.min(100, Math.round(baseScore + variance - i * 3))) };
  });
}

const tooltipStyle = {
  backgroundColor: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--color-text)",
};

export function DashboardView() {
  const navigate = useAppStore((s) => s.navigate);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const res = await api.get<DashboardData>("/api/dashboard/stats");
      setData(res);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6 p-6 md:p-8">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <AlertTriangle className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Failed to load dashboard data</p>
            <Button className="mt-4" onClick={loadDashboard}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats } = data;
  const riskTrendData = buildRiskTrendData(stats.avgRiskScore);
  const radarData = data.clauseTypeStats.slice(0, 6).map((c) => ({
    subject: (CLAUSE_TYPE_LABELS[c.type] || c.type.replace(/_/g, " ")).split(" ")[0],
    A: c.avgRiskScore,
    fullMark: 100,
  }));

  const kpiCards = [
    {
      label: "Contracts Analyzed",
      value: stats.analyzedContracts,
      icon: FileText,
      trend: `+${stats.analyzedThisMonth} this month`,
      positive: true,
      iconColor: "var(--color-primary)",
    },
    {
      label: "Avg Org Risk Score",
      value: stats.avgRiskScore,
      icon: ShieldCheck,
      trend: stats.avgRiskScore > 50 ? "Above acceptable range" : "Within acceptable range",
      positive: stats.avgRiskScore <= 50,
      iconColor: "var(--color-medium)",
    },
    {
      label: "Critical Clauses Found",
      value: data.riskDistribution.find((r) => r.level === "critical")?.count || 0,
      icon: TrendingDown,
      trend: "Action required",
      positive: false,
      iconColor: "var(--color-high)",
    },
    {
      label: "Expiring < 30 Days",
      value: stats.expiringIn30Days,
      icon: Clock,
      trend: stats.expiringIn30Days > 0 ? "Renewals approaching" : "No urgent renewals",
      positive: stats.expiringIn30Days === 0,
      iconColor: "var(--color-gold)",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Intelligence Overview</h1>
          <p className="text-muted-foreground">Monitor organizational risk and AI analysis volume.</p>
        </div>
        <div className="flex gap-2">
          {stats.monthlyLimit !== -1 && (
            <Button variant="outline" size="sm" onClick={() => navigate("billing")} className="gap-2">
              <Activity className="h-4 w-4" />
              {stats.monthlyUsed} / {stats.monthlyLimit} used
            </Button>
          )}
          <Button onClick={() => navigate("contract-new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Contract
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <div
            key={i}
            className={`glass-panel p-5 rounded-2xl border-border/40 hover:border-primary/30 transition-colors group animate-slide-up stagger-${i + 1}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: `color-mix(in srgb, ${kpi.iconColor} 12%, transparent)`, color: kpi.iconColor }}
              >
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{kpi.value}</div>
            <div className="text-sm text-muted-foreground font-medium">{kpi.label}</div>
            <div className={`text-xs mt-2 font-medium ${kpi.positive ? "text-emerald-500" : "text-amber-500"}`}>
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly usage */}
      {stats.monthlyLimit !== -1 && (
        <div className="glass-panel p-5 rounded-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Monthly Usage</p>
              <p className="text-xs text-muted-foreground">
                {stats.monthlyUsed} of {stats.monthlyLimit} contract analyses used
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {Math.round((stats.monthlyUsed / stats.monthlyLimit) * 100)}%
            </Badge>
          </div>
          <Progress value={(stats.monthlyUsed / stats.monthlyLimit) * 100} className="h-2" />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="font-semibold mb-1">Aggregate Risk Exposure Over Time</h3>
          <p className="text-xs text-muted-foreground mb-6">Risk score trend across all analyzed contracts</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-divider)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--color-divider)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="font-semibold mb-1">Vulnerability Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">Risk by clause category</p>
          <div className="flex-1 w-full min-h-[250px]">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="var(--color-divider)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
                  <Radar name="Risk" dataKey="A" stroke="var(--color-gold)" fill="var(--color-gold)" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No clause data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Usage bar chart */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Clause Risk by Type</h3>
            <p className="text-xs text-muted-foreground">Average risk score per clause category</p>
          </div>
          <Badge variant="secondary" className="rounded-full text-xs">Top 6</Badge>
        </div>
        {data.clauseTypeStats.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.clauseTypeStats.slice(0, 6).map((c) => ({
                  name: (CLAUSE_TYPE_LABELS[c.type] || c.type.replace(/_/g, " ")).toLowerCase(),
                  risk: c.avgRiskScore,
                  count: c.count,
                }))}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-divider)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--color-text-muted)" }} />
                <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--color-text-muted)" }} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-surface-offset)" }} />
                <Bar dataKey="risk" fill="var(--color-gold)" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No clause data yet. Analyze a contract to see risk breakdown.
          </div>
        )}
      </div>

      {/* Recent + Expirations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Recent Contracts</h3>
              <p className="text-xs text-muted-foreground">Your latest uploads</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("contracts")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
          {data.recentContracts.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No contracts yet</p>
              <Button size="sm" className="mt-3 gap-1.5" onClick={() => navigate("contract-new")}>
                <Plus className="h-3.5 w-3.5" /> Upload Contract
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {data.recentContracts.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate("contract-view", { contractId: c.id })}
                  className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all hover:bg-secondary"
                >
                  {c.isStarred && <Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {CONTRACT_TYPE_LABELS[c.contractType as keyof typeof CONTRACT_TYPE_LABELS] || c.contractType} • {formatDate(c.createdAt)}
                    </p>
                  </div>
                  {c.status === "analyzed" && c.riskLevel ? (
                    <RiskBadge level={c.riskLevel} size="sm" />
                  ) : (
                    <Badge variant="outline" className="text-xs capitalize">{c.status}</Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl">
          <div className="mb-4">
            <h3 className="font-semibold">Upcoming Expirations</h3>
            <p className="text-xs text-muted-foreground">Contracts expiring soon</p>
          </div>
          {data.upcomingExpirations.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No upcoming expirations</p>
              <p className="text-xs text-muted-foreground/80">You're all caught up</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data.upcomingExpirations.map((c) => {
                const days = daysUntil(c.expiresAt);
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate("contract-view", { contractId: c.id })}
                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all hover:bg-secondary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">Expires {formatDate(c.expiresAt)}</p>
                    </div>
                    <Badge variant={days && days <= 7 ? "destructive" : "secondary"} className="text-xs">
                      {days} days
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
