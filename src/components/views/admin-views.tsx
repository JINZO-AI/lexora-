"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  Shield,
  Search,
  Ban,
  Trash2,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RiskBadge } from "@/components/shared/risk-badge";
import { toast } from "sonner";
import {
  CONTRACT_TYPE_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/constants";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ============ Admin Dashboard / Analytics ============
export function AdminDashboardView() {
  const navigate = useAppStore((s) => s.navigate);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const res = await api.get<any>("/api/admin/analytics");
      setData(res);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Failed to load analytics</p>
            <Button className="mt-4" onClick={loadAnalytics}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = data.kpis;

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Analytics</h2>
        <p className="text-sm text-muted-foreground">Platform-wide metrics and insights</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contracts Today</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.contractsToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalContracts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalAiCalls}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth (30 days)</CardTitle>
            <CardDescription>Cumulative user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-primary)"
                  fill="url(#userGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Usage (14 days)</CardTitle>
            <CardDescription>Daily AI analysis calls</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.aiUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                <XAxis dataKey="date" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
            <CardDescription>Across all analyzed contracts</CardDescription>
          </CardHeader>
          <CardContent>
            {data.riskDistribution.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.riskDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="level" fontSize={11} width={70} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.riskDistribution.map((entry: any, i: number) => (
                      <Bar key={i} dataKey="count" fill={
                        entry.level === "critical" ? "var(--color-critical)" :
                        entry.level === "high" ? "var(--color-high)" :
                        entry.level === "medium" ? "var(--color-medium)" :
                        entry.level === "low" ? "var(--color-low)" : "var(--color-text-muted)"
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Risky Clause Types</CardTitle>
            <CardDescription>Highest average risk scores</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topClauseTypes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.topClauseTypes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-divider)" />
                  <XAxis type="number" domain={[0, 100]} fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="type"
                    fontSize={11}
                    width={100}
                    tickFormatter={(v) => v.replace(/_/g, " ")}
                  />
                  <Tooltip />
                  <Bar dataKey="avgRiskScore" radius={[0, 4, 4, 0]} fill="var(--color-high)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============ Admin Users View ============
export function AdminUsersView() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [detailUser, setDetailUser] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(loadUsers, 300);
    return () => clearTimeout(timer);
  }, [search, planFilter]);

  async function loadUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);
      const res = await api.get<{ users: any[] }>(`/api/admin/users?${params.toString()}`);
      setUsers(res.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  async function toggleSuspend(user: any) {
    try {
      await api.patch(`/api/admin/users/${user.id}`, { isSuspended: !user.isSuspended });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u))
      );
      toast.success(user.isSuspended ? "User reactivated" : "User suspended");
    } catch {
      toast.error("Failed to update user");
    }
  }

  async function changePlan(user: any, plan: string) {
    try {
      await api.patch(`/api/admin/users/${user.id}`, { subscriptionPlan: plan });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, subscriptionPlan: plan } : u))
      );
      toast.success(`Plan changed to ${plan}`);
    } catch {
      toast.error("Failed to update plan");
    }
  }

  async function viewUserDetail(user: any) {
    try {
      const res = await api.get<any>(`/api/admin/users/${user.id}`);
      setDetailUser(res);
    } catch {
      toast.error("Failed to load user details");
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-sm text-muted-foreground">{users.length} users on the platform</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={planFilter || "all"} onValueChange={(v) => setPlanFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Contracts</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.subscriptionPlan} onValueChange={(v) => changePlan(u, v)}>
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{u.contractCount}</TableCell>
                    <TableCell className="text-xs">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      {u.isSuspended ? (
                        <Badge variant="destructive">Suspended</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-low)]">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewUserDetail(u)} title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleSuspend(u)}
                          title={u.isSuspended ? "Reactivate" : "Suspend"}
                        >
                          {u.isSuspended ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User detail dialog */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{detailUser.user.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{detailUser.user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-medium">{detailUser.user.companyName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium capitalize">{detailUser.user.subscriptionPlan}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium">{formatDateTime(detailUser.user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contracts</p>
                  <p className="font-medium">{detailUser.user.contractCount}</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Recent Contracts</p>
                <div className="space-y-2">
                  {detailUser.recentContracts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No contracts</p>
                  ) : (
                    detailUser.recentContracts.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                        <span className="truncate">{c.title}</span>
                        <div className="flex items-center gap-2">
                          {c.riskLevel && <RiskBadge level={c.riskLevel} size="sm" />}
                          <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Admin Contracts View ============
export function AdminContractsView() {
  const navigate = useAppStore((s) => s.navigate);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(loadContracts, 300);
    return () => clearTimeout(timer);
  }, [search, riskFilter]);

  async function loadContracts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (riskFilter) params.set("riskLevel", riskFilter);
      const res = await api.get<{ contracts: any[] }>(`/api/admin/contracts?${params.toString()}`);
      setContracts(res.contracts);
    } catch {
      toast.error("Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All Contracts</h2>
        <p className="text-sm text-muted-foreground">{contracts.length} contracts across all users</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or user email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={riskFilter || "all"} onValueChange={(v) => setRiskFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All risks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risks</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No contracts found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate("contract-view", { contractId: c.id })}
                  >
                    <TableCell className="font-medium max-w-xs truncate">{c.title}</TableCell>
                    <TableCell className="text-xs">{c.user?.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {CONTRACT_TYPE_LABELS[c.contractType as keyof typeof CONTRACT_TYPE_LABELS] || c.contractType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.riskLevel ? <RiskBadge level={c.riskLevel} size="sm" /> : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(c.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
