import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// PATCH /api/contracts/[id]/clauses/[clauseId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; clauseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, clauseId } = await params;
  const body = await req.json();

  // Verify ownership
  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (body.isReviewedByUser !== undefined) updateData.isReviewedByUser = body.isReviewedByUser;
  if (body.userNote !== undefined) updateData.userNote = body.userNote || null;

  const updated = await db.contractClause.update({
    where: { id: clauseId, contractId: id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
