import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  CONTRACT_TYPE_LABELS,
  CLAUSE_TYPE_LABELS,
  RISK_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/constants";

// GET /api/contracts/[id]/report - download HTML report
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const contract = await db.contract.findFirst({
    where: { id, userId: user.id },
    include: {
      clauses: { orderBy: { riskScore: "desc" } },
      user: { select: { name: true, email: true, companyName: true } },
    },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const missingClauses = contract.missingClauses ? JSON.parse(contract.missingClauses) : [];
  const negotiationPriorities = contract.negotiationPriorities ? JSON.parse(contract.negotiationPriorities) : [];
  const immediateRedFlags = contract.immediateRedFlags ? JSON.parse(contract.immediateRedFlags) : [];

  const riskColor = (level: string | null) => {
    if (!level) return "#718096";
    switch (level) {
      case "critical": return "#dc2626";
      case "high": return "#ea580c";
      case "medium": return "#d97706";
      case "low": return "#16a34a";
      default: return "#718096";
    }
  };

  const clauseRiskColor = (level: string) => {
    switch (level) {
      case "critical": return "#dc2626";
      case "warning": return "#ea580c";
      case "attention": return "#d97706";
      case "safe": return "#16a34a";
      default: return "#718096";
    }
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>LEXORA Report — ${escapeHtml(contract.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #f7f6f2;
    color: #1a1a1a;
    line-height: 1.6;
    padding: 40px 20px;
  }
  .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: #1e3a2b; color: white; padding: 40px; }
  .header h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; margin-bottom: 8px; }
  .header h2 { font-size: 32px; font-weight: 700; margin-bottom: 16px; color: white; }
  .header .meta { display: flex; gap: 24px; font-size: 13px; opacity: 0.8; flex-wrap: wrap; }
  .header .meta span { display: flex; align-items: center; gap: 6px; }
  .content { padding: 40px; }
  .section { margin-bottom: 40px; }
  .section h3 { font-size: 20px; color: #1e3a2b; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e5e5; }
  .risk-score-box { display: flex; align-items: center; gap: 24px; background: #f7f6f2; padding: 24px; border-radius: 12px; }
  .risk-score-circle { width: 100px; height: 100px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: 700; }
  .risk-score-circle .score { font-size: 36px; line-height: 1; }
  .risk-score-circle .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.9; }
  .risk-info h4 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #718096; margin-bottom: 4px; }
  .risk-info .level { font-size: 24px; font-weight: 700; text-transform: capitalize; }
  .summary { font-size: 16px; line-height: 1.7; color: #2d3748; }
  .alert-list { list-style: none; }
  .alert-list li { padding: 12px 16px; border-radius: 8px; margin-bottom: 8px; display: flex; gap: 12px; align-items: flex-start; }
  .alert-list.red li { background: #fef2f2; border-left: 3px solid #dc2626; }
  .alert-list.amber li { background: #fffbeb; border-left: 3px solid #d97706; }
  .alert-list .num { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: white; }
  .alert-list.red .num { background: #dc2626; }
  .alert-list.amber .num { background: #d97706; }
  .clause { border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .clause-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
  .clause-title { font-size: 17px; font-weight: 600; color: #1a1a1a; }
  .clause-badges { display: flex; gap: 8px; align-items: center; }
  .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
  .clause-body { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 700px) { .clause-body { grid-template-columns: 1fr; } }
  .clause-section h5 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #718096; margin-bottom: 6px; }
  .clause-section p { font-size: 14px; color: #2d3748; line-height: 1.6; }
  .counter { background: #f0fdf4; padding: 12px; border-radius: 8px; border-left: 3px solid #16a34a; }
  .counter h5 { color: #15803d !important; }
  .footer { padding: 24px 40px; background: #f7f6f2; border-top: 1px solid #e5e5e5; font-size: 12px; color: #718096; text-align: center; }
  .footer strong { color: #1e3a2b; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>LEXORA Contract Analysis Report</h1>
    <h2>${escapeHtml(contract.title)}</h2>
    <div class="meta">
      <span>📄 ${CONTRACT_TYPE_LABELS[contract.contractType as keyof typeof CONTRACT_TYPE_LABELS] || contract.contractType}</span>
      <span>📊 ${contract.pageCount || "—"} pages • ${contract.wordCount || "—"} words</span>
      <span>📅 Analyzed ${contract.analyzedAt ? formatDate(contract.analyzedAt) : "—"}</span>
      <span>👤 ${escapeHtml(contract.user.name || contract.user.email)}</span>
    </div>
  </div>

  <div class="content">
    <div class="section">
      <h3>Risk Assessment</h3>
      <div class="risk-score-box">
        <div class="risk-score-circle" style="background: ${riskColor(contract.riskLevel)};">
          <span class="score">${contract.riskScore || "—"}</span>
          <span class="label">/ 100</span>
        </div>
        <div class="risk-info">
          <h4>Overall Risk Level</h4>
          <div class="level" style="color: ${riskColor(contract.riskLevel)};">
            ${contract.riskLevel ? RISK_LABELS[contract.riskLevel] : "Not assessed"}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Contract Summary</h3>
      <p class="summary">${escapeHtml(contract.summary || "No summary available.")}</p>
    </div>

    ${immediateRedFlags.length > 0 ? `
    <div class="section">
      <h3>🚨 Immediate Red Flags</h3>
      <ul class="alert-list red">
        ${immediateRedFlags.map((f: string, i: number) => `<li><span class="num">${i + 1}</span><span>${escapeHtml(f)}</span></li>`).join("")}
      </ul>
    </div>` : ""}

    ${missingClauses.length > 0 ? `
    <div class="section">
      <h3>⚠️ Missing Important Clauses</h3>
      <ul class="alert-list amber">
        ${missingClauses.map((c: string, i: number) => `<li><span class="num">${i + 1}</span><span>${escapeHtml(c)}</span></li>`).join("")}
      </ul>
    </div>` : ""}

    ${negotiationPriorities.length > 0 ? `
    <div class="section">
      <h3>🎯 Negotiation Priorities</h3>
      <ol style="padding-left: 20px;">
        ${negotiationPriorities.map((p: string, i: number) => `<li style="margin-bottom: 8px; font-size: 15px;">${escapeHtml(p)}</li>`).join("")}
      </ol>
    </div>` : ""}

    <div class="section">
      <h3>📋 Clause Analysis (${contract.clauses.length} clauses)</h3>
      ${contract.clauses.map((c, i) => `
      <div class="clause">
        <div class="clause-header">
          <div class="clause-title">${i + 1}. ${escapeHtml(c.title)}</div>
          <div class="clause-badges">
            <span class="badge" style="background: #f7f6f2; color: #4a5568;">${CLAUSE_TYPE_LABELS[c.clauseType] || c.clauseType}</span>
            <span class="badge" style="background: ${clauseRiskColor(c.riskLevel)}20; color: ${clauseRiskColor(c.riskLevel)};">${RISK_LABELS[c.riskLevel] || c.riskLevel} • ${c.riskScore}</span>
          </div>
        </div>
        <div class="clause-body">
          <div class="clause-section">
            <h5>Plain English</h5>
            <p>${escapeHtml(c.plainEnglish)}</p>
            <h5 style="margin-top: 12px;">Why it matters</h5>
            <p>${escapeHtml(c.riskExplanation)}</p>
          </div>
          <div class="clause-section">
            ${c.industryStandardClause ? `<h5>Industry Standard</h5><p>${escapeHtml(c.industryStandardClause)}</p>` : ""}
            ${c.suggestedCounterProposal ? `<div class="counter"><h5>Suggested Counter-Proposal</h5><p>${escapeHtml(c.suggestedCounterProposal)}</p></div>` : ""}
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>

  <div class="footer">
    Generated by <strong>LEXORA</strong> — AI Contract Intelligence Platform<br>
    Report created on ${formatDateTime(new Date())} • This report is confidential and intended for the recipient only.
  </div>
</div>
</body>
</html>`;

  // Write audit log
  await db.auditLog.create({
    data: {
      userId: user.id,
      action: "report_exported",
      entityType: "contract",
      entityId: id,
      ipAddress: req.headers.get("x-forwarded-for") || null,
      userAgent: req.headers.get("user-agent") || null,
    },
  });

  const safeName = contract.title.replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 50);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="LEXORA_Report_${safeName}.html"`,
    },
  });
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
