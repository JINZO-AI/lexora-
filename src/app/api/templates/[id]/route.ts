import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/templates/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const template = await db.contractTemplate.findFirst({
    where: {
      id,
      OR: [{ createdBy: user.id }, { isPublic: true, isApproved: true }],
    },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...template,
    variables: template.variables ? JSON.parse(template.variables) : [],
  });
}

// PUT /api/templates/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const template = await db.contractTemplate.findFirst({
    where: { id, createdBy: user.id },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found or you don't have permission" }, { status: 404 });
  }

  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category !== undefined) updateData.category = body.category;
  if (body.language !== undefined) updateData.language = body.language;
  if (body.content !== undefined) {
    updateData.content = body.content;
    // Re-extract variables
    const extractedVars = Array.from(body.content.matchAll(/\{\{(\w+)\}\}/g)).map((m: string[]) => m[1]);
    updateData.variables = JSON.stringify([...new Set(extractedVars)]);
  }
  if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;

  const updated = await db.contractTemplate.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    ...updated,
    variables: JSON.parse(updated.variables || "[]"),
  });
}

// DELETE /api/templates/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const template = await db.contractTemplate.findFirst({
    where: {
      id,
      OR: [{ createdBy: user.id }, ...(user.role === "admin" ? [{}] : [])],
    },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found or you don't have permission" }, { status: 404 });
  }

  await db.contractTemplate.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
