import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/contracts/[id]/star - toggle star
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: { id: true, isStarred: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const updated = await db.contract.update({
    where: { id },
    data: { isStarred: !contract.isStarred },
  });

  return NextResponse.json({ isStarred: updated.isStarred });
}
