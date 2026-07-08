import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/contracts/[id]/share - generate share link
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: { id: true, isShared: true, shareToken: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  let shareToken = contract.shareToken;
  if (!shareToken) {
    shareToken = crypto.randomBytes(32).toString("hex");
  }

  const updated = await db.contract.update({
    where: { id },
    data: {
      isShared: true,
      shareToken,
    },
  });

  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "contract_shared",
      entityType: "contract",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  return NextResponse.json({
    shareToken: updated.shareToken,
    shareUrl: `/shared/${updated.shareToken}`,
  });
}

// DELETE /api/contracts/[id]/share - revoke share
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  await db.contract.update({
    where: { id },
    data: {
      isShared: false,
      shareToken: null,
    },
  });

  return NextResponse.json({ success: true });
}
