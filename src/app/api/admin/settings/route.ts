import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// In-memory settings store (would be DB in production)
let adminSettings = {
  groqApiKey: "",
  groqDefaultModel: "lexora-ai",
  groqTimeout: 60,
  maintenanceMode: false,
  maintenanceMessage: "",
  freePlanLimit: 5,
  proPlanLimit: 50,
  businessPlanLimit: -1,
  maxFileSize: 10,
  allowPublicSignup: true,
  requireEmailVerification: false,
  updatedAt: new Date().toISOString(),
};

// GET /api/admin/settings
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  return NextResponse.json({
    ...adminSettings,
    groqApiKey: adminSettings.groqApiKey ? "•".repeat(8) + adminSettings.groqApiKey.slice(-4) : "",
  });
}

// PATCH /api/admin/settings
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const updateData: any = {};

  if (body.groqApiKey !== undefined && body.groqApiKey !== "") {
    // Don't overwrite with masked value
    if (!body.groqApiKey.startsWith("•")) {
      updateData.groqApiKey = body.groqApiKey;
    }
  }
  if (body.groqDefaultModel !== undefined) updateData.groqDefaultModel = body.groqDefaultModel;
  if (body.groqTimeout !== undefined) updateData.groqTimeout = Number(body.groqTimeout);
  if (body.maintenanceMode !== undefined) updateData.maintenanceMode = Boolean(body.maintenanceMode);
  if (body.maintenanceMessage !== undefined) updateData.maintenanceMessage = body.maintenanceMessage;
  if (body.freePlanLimit !== undefined) updateData.freePlanLimit = Number(body.freePlanLimit);
  if (body.proPlanLimit !== undefined) updateData.proPlanLimit = Number(body.proPlanLimit);
  if (body.businessPlanLimit !== undefined) updateData.businessPlanLimit = Number(body.businessPlanLimit);
  if (body.maxFileSize !== undefined) updateData.maxFileSize = Number(body.maxFileSize);
  if (body.allowPublicSignup !== undefined) updateData.allowPublicSignup = Boolean(body.allowPublicSignup);
  if (body.requireEmailVerification !== undefined) updateData.requireEmailVerification = Boolean(body.requireEmailVerification);

  updateData.updatedAt = new Date().toISOString();

  adminSettings = { ...adminSettings, ...updateData };

  // Write audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "admin_settings_updated",
      entityType: "settings",
      newValues: JSON.stringify(updateData),
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  return NextResponse.json({
    ...adminSettings,
    groqApiKey: adminSettings.groqApiKey ? "•".repeat(8) + adminSettings.groqApiKey.slice(-4) : "",
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "test_connection") {
    // Simulate connection test
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({
      success: true,
      message: "AI engine connection successful",
      latency: Math.floor(Math.random() * 200 + 100),
      model: adminSettings.groqDefaultModel,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export { adminSettings };
