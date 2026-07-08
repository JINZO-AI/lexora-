import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// POST /api/subscription/upgrade - upgrade subscription plan
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { plan, billingCycle } = body; // plan: pro | business, billingCycle: monthly | yearly

  if (!plan || !["pro", "business"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan. Choose 'pro' or 'business'." }, { status: 400 });
  }

  const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // Calculate subscription expiry
  const now = new Date();
  const expiresAt = new Date(now);
  if (billingCycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  // Update user subscription
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      subscriptionPlan: plan,
      monthlyLimit: planConfig.monthlyLimit,
      subscriptionExpiresAt: expiresAt,
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      monthlyLimit: true,
    },
  });

  // Write audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "subscription_upgraded",
      entityType: "user",
      entityId: user.id,
      newValues: JSON.stringify({ plan, billingCycle, expiresAt: expiresAt.toISOString() }),
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  // Create notification
  await db.notification.create({
    data: {
      userId: user.id,
      type: "subscription",
      title: `Upgraded to ${planConfig.name} plan`,
      body: billingCycle === "yearly"
        ? `Your ${planConfig.name} subscription is active for 1 year. You now have ${planConfig.monthlyLimit === -1 ? "unlimited" : planConfig.monthlyLimit} contract analyses per month.`
        : `Your ${planConfig.name} subscription is active for 1 month. You now have ${planConfig.monthlyLimit === -1 ? "unlimited" : planConfig.monthlyLimit} contract analyses per month.`,
      actionUrl: "settings",
    },
  });

  // Calculate price
  const price = billingCycle === "yearly" ? planConfig.price * 12 * 0.8 : planConfig.price; // 20% yearly discount

  return NextResponse.json({
    success: true,
    user: updated,
    receipt: {
      plan: planConfig.name,
      billingCycle,
      price: billingCycle === "yearly" ? planConfig.price * 12 * 0.8 : planConfig.price,
      currency: "USD",
      expiresAt: expiresAt.toISOString(),
      monthlyLimit: planConfig.monthlyLimit,
      transactionId: `txn_${Date.now()}_${user.id.substring(0, 8)}`,
    },
  });
}

// GET /api/subscription/upgrade - get available plans + current subscription
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      contractsAnalyzedThisMonth: true,
      monthlyLimit: true,
      createdAt: true,
    },
  });

  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    current: {
      plan: dbUser.subscriptionPlan,
      expiresAt: dbUser.subscriptionExpiresAt,
      monthlyUsed: dbUser.contractsAnalyzedThisMonth,
      monthlyLimit: dbUser.monthlyLimit,
    },
    plans: Object.entries(SUBSCRIPTION_PLANS).map(([key, p]) => ({
      id: key,
      name: p.name,
      monthlyPrice: p.price,
      yearlyPrice: Math.round(p.price * 12 * 0.8),
      monthlyLimit: p.monthlyLimit,
      isCurrent: key === dbUser.subscriptionPlan,
    })),
  });
}
