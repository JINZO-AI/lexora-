import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/contracts/shared/[token] - public shared contract view
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await db.contract.findFirst({
    where: {
      shareToken: token,
      isShared: true,
      status: "analyzed",
    },
    include: {
      clauses: { orderBy: { riskScore: "desc" } },
      user: {
        select: { name: true, companyName: true },
      },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Shared contract not found or no longer available" }, { status: 404 });
  }

  return NextResponse.json({
    id: contract.id,
    title: contract.title,
    contractType: contract.contractType,
    riskScore: contract.riskScore,
    riskLevel: contract.riskLevel,
    summary: contract.summary,
    summary2: contract.summary,
    missingClauses: contract.missingClauses ? JSON.parse(contract.missingClauses) : [],
    negotiationPriorities: contract.negotiationPriorities ? JSON.parse(contract.negotiationPriorities) : [],
    immediateRedFlags: contract.immediateRedFlags ? JSON.parse(contract.immediateRedFlags) : [],
    analyzedAt: contract.analyzedAt,
    pageCount: contract.pageCount,
    wordCount: contract.wordCount,
    sharedBy: contract.user.name || contract.user.companyName || "LEXORA User",
    clauses: contract.clauses.map((c) => ({
      id: c.id,
      clauseType: c.clauseType,
      title: c.title,
      originalText: c.originalText,
      pageNumber: c.pageNumber,
      riskScore: c.riskScore,
      riskLevel: c.riskLevel,
      riskExplanation: c.riskExplanation,
      plainEnglish: c.plainEnglish,
      industryStandardClause: c.industryStandardClause,
      suggestedCounterProposal: c.suggestedCounterProposal,
    })),
  });
}
