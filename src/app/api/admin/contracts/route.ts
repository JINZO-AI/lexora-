import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/admin/contracts - all contracts across all users
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const riskLevel = searchParams.get("riskLevel") || "";
  const status = searchParams.get("status") || "";
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { user: { email: { contains: search } } },
    ];
  }
  if (riskLevel) where.riskLevel = riskLevel;
  if (status) where.status = status;

  const [contracts, total] = await Promise.all([
    db.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        _count: { select: { clauses: true } },
      },
    }),
    db.contract.count({ where }),
  ]);

  return NextResponse.json({
    contracts: contracts.map((c) => ({
      ...c,
      clauseCount: c._count.clauses,
    })),
    total,
  });
}
