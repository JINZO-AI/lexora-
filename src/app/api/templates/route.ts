import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// GET /api/templates - list templates (user's own + public)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search") || "";
  const publicOnly = searchParams.get("public") === "true";

  const where: any = {
    OR: publicOnly
      ? [{ isPublic: true, isApproved: true }]
      : [{ createdBy: user.id }, { isPublic: true, isApproved: true }],
  };
  if (category) where.category = category;
  if (search) where.title = { contains: search };

  const templates = await db.contractTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return NextResponse.json({
    templates: templates.map((t) => ({
      ...t,
      variables: t.variables ? JSON.parse(t.variables) : [],
    })),
  });
}

// POST /api/templates - create template
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, category, language, content, variables, isPublic } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  // Extract variables from content ({{variable_name}})
  const extractedVars = Array.from(content.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]);
  const allVars = [...new Set([...(variables || []), ...extractedVars])];

  const template = await db.contractTemplate.create({
    data: {
      createdBy: user.id,
      title: title.trim(),
      description: description || null,
      category: category || "general",
      language: language || "en",
      content,
      variables: JSON.stringify(allVars),
      isPublic: Boolean(isPublic),
      isApproved: user.role === "admin" ? true : false,
    },
  });

  return NextResponse.json({
    ...template,
    variables: JSON.parse(template.variables || "[]"),
  }, { status: 201 });
}
