import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// GET /api/admin/users/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  const targetUser = await db.user.findUnique({
    where: { id },
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
      timezone: true,
      preferredLanguage: true,
      _count: {
        select: { contracts: true, templates: true },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const recentContracts = await db.contract.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      status: true,
      riskLevel: true,
      riskScore: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user: {
      ...targetUser,
      contractCount: targetUser._count.contracts,
      templateCount: targetUser._count.templates,
    },
    recentContracts,
  });
}

// PATCH /api/admin/users/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updateData: any = {};
  if (body.role !== undefined) updateData.role = body.role;
  if (body.subscriptionPlan !== undefined) {
    updateData.subscriptionPlan = body.subscriptionPlan;
    const plan = body.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS;
    updateData.monthlyLimit = SUBSCRIPTION_PLANS[plan]?.monthlyLimit ?? 5;
  }
  if (body.isSuspended !== undefined) updateData.isSuspended = body.isSuspended;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.companyName !== undefined) updateData.companyName = body.companyName;

  const updated = await db.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      subscriptionPlan: true,
      isSuspended: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
