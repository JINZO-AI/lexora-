import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/contracts/[id]/tags - attach tags to a contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { tagIds } = body;

  if (!Array.isArray(tagIds)) {
    return NextResponse.json({ error: "tagIds must be an array" }, { status: 400 });
  }

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Remove existing tags, then add new ones
  await db.contractTagPivot.deleteMany({ where: { contractId: id } });

  if (tagIds.length > 0) {
    // Verify all tags belong to the user
    const validTags = await db.contractTag.findMany({
      where: { id: { in: tagIds }, userId: user.id },
      select: { id: true },
    });

    if (validTags.length > 0) {
      await db.contractTagPivot.createMany({
        data: validTags.map((t) => ({ contractId: id, tagId: t.id })),
      });
    }
  }

  const tags = await db.contractTagPivot.findMany({
    where: { contractId: id },
    include: { tag: true },
  });

  return NextResponse.json({ tags: tags.map((t) => t.tag) });
}
