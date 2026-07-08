import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserWithProfile } from "@/lib/session";

// GET /api/dashboard/stats
export async function GET(req: NextRequest) {
  const user = await getCurrentUserWithProfile();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalContracts,
    analyzedContracts,
    analyzedThisMonth,
    expiringIn30Days,
    riskDistribution,
    recentContracts,
    upcomingExpirations,
    clauseTypeStats,
  ] = await Promise.all([
    db.contract.count({ where: { userId: user.id } }),
    db.contract.count({ where: { userId: user.id, status: "analyzed" } }),
    db.contract.count({
      where: {
        userId: user.id,
        analyzedAt: { gte: startOfMonth },
      },
    }),
    db.contract.count({
      where: {
        userId: user.id,
        expiresAt: { gte: now, lte: thirtyDaysFromNow },
      },
    }),
    db.contract.groupBy({
      by: ["riskLevel"],
      where: { userId: user.id, status: "analyzed" },
      _count: true,
    }),
    db.contract.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { clauses: true } } },
    }),
    db.contract.findMany({
      where: {
        userId: user.id,
        expiresAt: { gte: now },
      },
      orderBy: { expiresAt: "asc" },
      take: 5,
    }),
    db.contractClause.groupBy({
      by: ["clauseType"],
      where: { contract: { userId: user.id } },
      _count: true,
      _avg: { riskScore: true },
    }),
  ]);

  const avgRiskScore = analyzedContracts > 0
    ? Math.round(
        (await db.contract.aggregate({
          where: { userId: user.id, status: "analyzed" },
          _avg: { riskScore: true },
        }))._avg.riskScore || 0
      )
    : 0;

  return NextResponse.json({
    stats: {
      totalContracts,
      analyzedContracts,
      analyzedThisMonth,
      expiringIn30Days,
      avgRiskScore,
      monthlyLimit: user.monthlyLimit,
      monthlyUsed: user.contractsAnalyzedThisMonth,
    },
    riskDistribution: riskDistribution.map((r) => ({
      level: r.riskLevel || "unknown",
      count: r._count,
    })),
    recentContracts: recentContracts.map((c) => ({
      ...c,
      clauseCount: c._count.clauses,
    })),
    upcomingExpirations,
    clauseTypeStats: clauseTypeStats.map((c) => ({
      type: c.clauseType,
      count: c._count,
      avgRiskScore: Math.round(c._avg.riskScore || 0),
    })),
  });
}
