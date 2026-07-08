import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { parseContractFile } from "@/lib/file-storage";
import { analyzeContract } from "@/lib/ai-service";
import { riskLevelFromScore } from "@/lib/constants";

// POST /api/contracts/[id]/analyze
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.status === "processing") {
    return NextResponse.json({ error: "Analysis already in progress" }, { status: 409 });
  }

  // Set status to processing
  await db.contract.update({
    where: { id: contract.id },
    data: { status: "processing" },
  });

  try {
    // Parse the file
    const parsed = await parseContractFile(contract.filePath, contract.mimeType);

    if (!parsed.text || parsed.text.trim().length < 50) {
      await db.contract.update({
        where: { id: contract.id },
        data: {
          status: "failed",
          notes: "Could not extract sufficient text from this file. Try a different file format.",
        },
      });
      return NextResponse.json({
        error: "Could not extract sufficient text from this file. Please try a different file or format.",
      }, { status: 422 });
    }

    // Call AI analysis
    const result = await analyzeContract(
      parsed.text,
      contract.contractType,
      contract.id,
      user.id
    );

    // Delete existing clauses (in case of re-analysis)
    await db.contractClause.deleteMany({ where: { contractId: contract.id } });

    // Create clause records
    const clauseRecords = result.clauses.map((c) => ({
      contractId: contract.id,
      clauseType: c.clause_type,
      title: c.title,
      originalText: c.original_text,
      pageNumber: c.page_number || 1,
      riskScore: c.risk_score,
      riskLevel: c.risk_level,
      riskExplanation: c.risk_explanation,
      plainEnglish: c.plain_english,
      industryStandardClause: c.industry_standard_clause || null,
      suggestedCounterProposal: c.suggested_counter_proposal || null,
    }));

    if (clauseRecords.length > 0) {
      await db.contractClause.createMany({ data: clauseRecords });
    }

    // Calculate final risk score (weighted average)
    const weights: Record<string, number> = { critical: 4, warning: 3, attention: 2, safe: 1 };
    const totalWeight = result.clauses.reduce((sum, c) => sum + (weights[c.risk_level] || 1), 0);
    const weightedScore = result.clauses.length > 0
      ? Math.round(result.clauses.reduce((sum, c) => sum + c.risk_score * (weights[c.risk_level] || 1), 0) / totalWeight)
      : result.overall_risk_score;

    const finalScore = Math.max(0, Math.min(100, weightedScore || result.overall_risk_score));
    const riskLevel = riskLevelFromScore(finalScore);

    // Update contract
    const updated = await db.contract.update({
      where: { id: contract.id },
      data: {
        status: "analyzed",
        riskScore: finalScore,
        riskLevel,
        summary: result.summary,
        language: result.detected_language || contract.language,
        pageCount: parsed.pageCount,
        wordCount: parsed.wordCount,
        missingClauses: JSON.stringify(result.missing_important_clauses),
        negotiationPriorities: JSON.stringify(result.negotiation_priorities),
        immediateRedFlags: JSON.stringify(result.immediate_red_flags),
        analyzedAt: new Date(),
      },
      include: { clauses: { orderBy: { riskScore: "desc" } } },
    });

    // Increment user's monthly count
    await db.user.update({
      where: { id: user.id },
      data: { contractsAnalyzedThisMonth: { increment: 1 } },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: user.id,
        type: "analysis_complete",
        title: `Analysis complete: ${contract.title}`,
        body: `Risk level: ${riskLevel} (score: ${finalScore}/100). ${result.clauses.length} clauses analyzed.`,
        actionUrl: `contract-view:${contract.id}`,
      },
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "contract_analyzed",
        entityType: "contract",
        entityId: contract.id,
        newValues: JSON.stringify({ riskScore: finalScore, riskLevel, clauseCount: result.clauses.length }),
        ipAddress: req.headers.get("x-forwarded-for") || null,
        userAgent: req.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({
      ...updated,
      missingClauses: JSON.parse(updated.missingClauses || "[]"),
      negotiationPriorities: JSON.parse(updated.negotiationPriorities || "[]"),
      immediateRedFlags: JSON.parse(updated.immediateRedFlags || "[]"),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    await db.contract.update({
      where: { id: contract.id },
      data: {
        status: "failed",
        notes: error instanceof Error ? `Analysis failed: ${error.message}` : "Analysis failed",
      },
    });

    return NextResponse.json({
      error: error instanceof Error ? error.message : "Analysis failed. Please try again.",
    }, { status: 500 });
  }
}
