import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { deleteContractFile } from "@/lib/file-storage";

// GET /api/contracts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    include: {
      clauses: { orderBy: { riskScore: "desc" } },
      tags: { include: { tag: true } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...contract,
    missingClauses: contract.missingClauses ? JSON.parse(contract.missingClauses) : null,
    negotiationPriorities: contract.negotiationPriorities ? JSON.parse(contract.negotiationPriorities) : null,
    immediateRedFlags: contract.immediateRedFlags ? JSON.parse(contract.immediateRedFlags) : null,
    tags: contract.tags.map((t) => t.tag),
  });
}

// PATCH /api/contracts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.contractType !== undefined) updateData.contractType = body.contractType;
  if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.isStarred !== undefined) updateData.isStarred = body.isStarred;
  if (body.status !== undefined) updateData.status = body.status;

  const updated = await db.contract.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// DELETE /api/contracts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({ where: { id, userId: user.id } });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Delete file from disk
  await deleteContractFile(contract.filePath);

  // Store contract info before deletion for audit log
  const contractInfo = { title: contract.title, contractType: contract.contractType };

  // Delete contract (cascades to clauses, tags, reminders)
  await db.contract.delete({ where: { id } });

  // Write audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "contract_deleted",
      entityType: "contract",
      entityId: id,
      oldValues: JSON.stringify(contractInfo),
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  return NextResponse.json({ success: true });
}
