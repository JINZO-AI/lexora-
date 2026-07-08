import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/admin/analytics
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalUsers,
    totalContracts,
    contractsToday,
    totalAiCalls,
    recentAiCalls,
    riskDistribution,
    contractsByType,
    topClauseTypes,
    userGrowth,
    aiUsageByDay,
  ] = await Promise.all([
    db.user.count(),
    db.contract.count(),
    db.contract.count({
      where: { createdAt: { gte: today } },
    }),
    db.aiAnalysisLog.count(),
    db.aiAnalysisLog.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true, status: true, taskType: true },
    }),
    db.contract.groupBy({
      by: ["riskLevel"],
      where: { status: "analyzed" },
      _count: true,
    }),
    db.contract.groupBy({
      by: ["contractType"],
      _count: true,
    }),
    db.contractClause.groupBy({
      by: ["clauseType"],
      _count: true,
      _avg: { riskScore: true },
      orderBy: { _avg: { riskScore: "desc" } },
      take: 5,
    }),
    db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    }),
    db.contract.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  // Build user growth chart data (last 30 days)
  const userGrowthData: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const count = userGrowth.filter((u) => {
      const uDate = new Date(u.createdAt).toISOString().split("T")[0];
      return uDate <= dateStr;
    }).length;
    userGrowthData.push({ date: dateStr, count });
  }

  // Build AI usage chart data (last 14 days)
  const aiUsageData: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const count = recentAiCalls.filter((c) => {
      const cDate = new Date(c.createdAt).toISOString().split("T")[0];
      return cDate === dateStr;
    }).length;
    aiUsageData.push({ date: dateStr, count });
  }

  return NextResponse.json({
    kpis: {
      totalUsers,
      totalContracts,
      contractsToday,
      totalAiCalls,
    },
    riskDistribution: riskDistribution.map((r) => ({
      level: r.riskLevel || "unknown",
      count: r._count,
    })),
    contractsByType: contractsByType.map((c) => ({
      type: c.contractType,
      count: c._count,
    })),
    topClauseTypes: topClauseTypes.map((c) => ({
      type: c.clauseType,
      count: c._count,
      avgRiskScore: Math.round(c._avg.riskScore || 0),
    })),
    userGrowth: userGrowthData,
    aiUsage: aiUsageData,
  });
}
