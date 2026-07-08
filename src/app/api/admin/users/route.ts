import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan");
  const suspended = searchParams.get("suspended");

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
      { companyName: { contains: search } },
    ];
  }
  if (plan) where.subscriptionPlan = plan;
  if (suspended === "true") where.isSuspended = true;
  if (suspended === "false") where.isSuspended = false;

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      companySize: true,
      role: true,
      subscriptionPlan: true,
      isSuspended: true,
      createdAt: true,
      contractsAnalyzedThisMonth: true,
      monthlyLimit: true,
      _count: {
        select: { contracts: true },
      },
    },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      contractCount: u._count.contracts,
    })),
  });
}
