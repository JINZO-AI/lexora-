import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { generateContractTemplate } from "@/lib/ai-service";

// POST /api/templates/generate - AI generate a template
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { templateType, variables, jurisdiction } = body;

  if (!templateType?.trim()) {
    return NextResponse.json({ error: "Template type is required" }, { status: 400 });
  }

  try {
    const content = await generateContractTemplate(
      templateType,
      variables || [],
      jurisdiction || "United States",
      user.id
    );

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Template generation error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate template",
    }, { status: 500 });
  }
}
