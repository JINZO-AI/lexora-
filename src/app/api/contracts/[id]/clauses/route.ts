import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/contracts/[id]/clauses
export async function GET(
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

  const clauses = await db.contractClause.findMany({
    where: { contractId: id },
    orderBy: { riskScore: "desc" },
  });

  return NextResponse.json({ clauses });
}
