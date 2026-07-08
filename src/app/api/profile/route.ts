import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/profile - update profile
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const updateData: any = {};

  if (body.name !== undefined) updateData.name = body.name?.trim() || null;
  if (body.companyName !== undefined) updateData.companyName = body.companyName?.trim() || null;
  if (body.companySize !== undefined) updateData.companySize = body.companySize || null;
  if (body.timezone !== undefined) updateData.timezone = body.timezone || "UTC";
  if (body.preferredLanguage !== undefined) updateData.preferredLanguage = body.preferredLanguage || "en";

  const updated = await db.user.update({
    where: { id: user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      companySize: true,
      role: true,
      subscriptionPlan: true,
      timezone: true,
      preferredLanguage: true,
    },
  });

  // Write audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "profile_updated",
      entityType: "user",
      entityId: user.id,
      newValues: JSON.stringify(updateData),
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  return NextResponse.json({ user: updated });
}

// GET /api/profile - get full profile
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      companyName: true,
      companySize: true,
      role: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      contractsAnalyzedThisMonth: true,
      monthlyLimit: true,
      timezone: true,
      preferredLanguage: true,
      createdAt: true,
      _count: {
        select: { contracts: true, templates: true, notifications: true },
      },
    },
  });

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...profile,
    contractCount: profile._count.contracts,
    templateCount: profile._count.templates,
    notificationCount: profile._count.notifications,
  });
}
