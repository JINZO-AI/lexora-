import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/tags - list user's tags
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await db.contractTag.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { contracts: true } },
    },
  });

  return NextResponse.json({
    tags: tags.map((t) => ({
      ...t,
      contractCount: t._count.contracts,
    })),
  });
}

// POST /api/tags - create a tag
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, color } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Tag name is required" }, { status: 400 });
  }

  const existing = await db.contractTag.findFirst({
    where: { userId: user.id, name: name.trim() },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const tag = await db.contractTag.create({
    data: {
      userId: user.id,
      name: name.trim(),
      color: color || "#1e3a2b",
    },
  });

  return NextResponse.json(tag, { status: 201 });
}

// DELETE /api/tags - delete a tag
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tagId = searchParams.get("id");

  if (!tagId) {
    return NextResponse.json({ error: "Tag id is required" }, { status: 400 });
  }

  await db.contractTag.deleteMany({
    where: { id: tagId, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
