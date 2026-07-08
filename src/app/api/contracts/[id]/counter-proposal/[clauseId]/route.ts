import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { generateCounterProposal } from "@/lib/ai-service";

// POST /api/contracts/[id]/counter-proposal/[clauseId]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; clauseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, clauseId } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      title: true,
      contractType: true,
      companyName: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const clause = await db.contractClause.findFirst({
    where: { id: clauseId, contractId: id },
  });

  if (!clause) {
    return NextResponse.json({ error: "Clause not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const businessContext = body.businessContext || undefined;

  try {
    const result = await generateCounterProposal(
      clause.originalText,
      clause.clauseType,
      clause.title,
      businessContext,
      contract.id,
      user.id
    );

    // Update the clause with the new counter-proposal
    await db.contractClause.update({
      where: { id: clauseId },
      data: { suggestedCounterProposal: result.counter_proposal },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Counter-proposal error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to generate counter-proposal",
    }, { status: 500 });
  }
}
