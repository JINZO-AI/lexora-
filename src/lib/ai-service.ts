import { db } from "@/lib/db";
import type { AIAnalysisResult, CounterProposalResult } from "@/lib/types";
import { riskLevelFromScore, clauseRiskLevelFromScore } from "@/lib/constants";

// ============================================
// AI Service - uses Groq SDK in production
// Falls back to z-ai-web-dev-sdk for sandbox dev
// ============================================

let groqClient: any = null;
let zaiInstance: any = null;

async function getAIClient() {
  // If GROQ_API_KEY is set, use real Groq
  if (process.env.GROQ_API_KEY) {
    if (!groqClient) {
      const { Groq } = await import("groq-sdk");
      groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return { type: "groq" as const, client: groqClient };
  }

  // Fallback to z-ai-web-dev-sdk (sandbox only)
  if (!zaiInstance) {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    zaiInstance = await ZAI.create();
  }
  return { type: "zai" as const, client: zaiInstance };
}

const SYSTEM_PROMPT = `You are an expert contract lawyer with 20 years of experience protecting small and medium-sized businesses.
Your job is to analyze contracts and identify every risk to the business owner.
You MUST respond with valid JSON only. No explanation outside the JSON. No markdown code fences. No preamble.

The JSON must follow this exact structure:
{
  "contract_type": "string (employment|nda|vendor|service|lease|partnership|custom)",
  "summary": "string - 3 sentences in plain English explaining what this contract is about and its main purpose",
  "overall_risk_score": number 0-100,
  "detected_language": "string (en|fr|es|ar)",
  "clauses": [
    {
      "clause_type": "string (liability|payment|termination|ip_ownership|auto_renewal|confidentiality|dispute_resolution|warranty|indemnification|force_majeure|other)",
      "title": "string - short descriptive name for this clause",
      "original_text": "string - the exact text from the contract that you are analyzing",
      "page_number": number,
      "risk_score": number 0-100,
      "risk_level": "string (safe|attention|warning|critical)",
      "risk_explanation": "string - exactly why this is risky (or safe) for the business owner, be specific",
      "plain_english": "string - what this clause means in simple everyday terms a non-lawyer can understand",
      "industry_standard_clause": "string - what a balanced, fair version of this clause looks like",
      "suggested_counter_proposal": "string - exact replacement text to propose that protects the business owner"
    }
  ],
  "missing_important_clauses": ["string - name of each missing clause and why it matters"],
  "negotiation_priorities": ["string - ordered list of what to negotiate first, most important first"],
  "immediate_red_flags": ["string - must-fix issues before signing"]
}

Rules:
- Identify ALL significant clauses in the contract (usually 4-12 clauses)
- Be thorough but accurate - only flag real risks
- risk_score: 0-20 = safe, 21-40 = attention, 41-70 = warning, 71-100 = critical
- Always provide suggested_counter_proposal text that the business owner can use directly
- If a clause is missing entirely (e.g. no termination clause), add it to missing_important_clauses
- Respond with ONLY the JSON object, nothing else.`;

const COUNTER_PROPOSAL_SYSTEM = `You are an expert contract negotiator who helps small business owners get better terms.
You MUST respond with valid JSON only. No markdown. No explanation outside JSON.

JSON structure:
{
  "counter_proposal": "string - the exact replacement clause text to propose",
  "reasoning": "string - explain why this counter-proposal is fair and protects the business",
  "negotiation_tips": ["string - actionable tips for negotiating this clause"]
}

Respond with ONLY the JSON object.`;

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // continue
      }
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch {
        // continue
      }
    }
  }
  throw new Error("Failed to parse AI response as JSON");
}

function sanitizeClause(clause: Partial<any>): any {
  const validClauseTypes = [
    "liability", "payment", "termination", "ip_ownership", "auto_renewal",
    "confidentiality", "dispute_resolution", "warranty", "indemnification",
    "force_majeure", "other",
  ];
  const validRiskLevels = ["safe", "attention", "warning", "critical"];

  const clauseType = validClauseTypes.includes(clause.clause_type || "")
    ? clause.clause_type!
    : "other";
  const riskScore = Math.max(0, Math.min(100, Math.round(clause.risk_score || 0)));
  const riskLevel = validRiskLevels.includes(clause.risk_level || "")
    ? clause.risk_level!
    : clauseRiskLevelFromScore(riskScore);

  return {
    clause_type: clauseType,
    title: (clause.title || "Untitled Clause").substring(0, 200),
    original_text: clause.original_text || "",
    page_number: clause.page_number || 1,
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_explanation: clause.risk_explanation || "No explanation provided.",
    plain_english: clause.plain_english || "No plain English explanation provided.",
    industry_standard_clause: clause.industry_standard_clause || "",
    suggested_counter_proposal: clause.suggested_counter_proposal || "",
  };
}

async function callGroq(messages: any[], model: string, temperature: number, maxTokens: number): Promise<string> {
  const completion = await groqClient.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content || "";
}

async function callZAI(messages: any[]): Promise<string> {
  const completion = await zaiInstance.chat.completions.create({
    messages,
    thinking: { type: "disabled" as const },
  });
  return completion.choices[0]?.message?.content || "";
}

export async function analyzeContract(
  contractText: string,
  contractType: string,
  contractId?: string,
  userId?: string
): Promise<AIAnalysisResult> {
  const ai = await getAIClient();
  const startTime = Date.now();
  let status: "success" | "failed" = "success";
  let errorMessage: string | null = null;
  const modelUsed = process.env.GROQ_API_KEY
    ? (process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile")
    : "z-ai-llm";

  try {
    const truncatedText = contractText.length > 12000
      ? contractText.substring(0, 12000) + "\n\n[... contract truncated for analysis ...]"
      : contractText;

    const userMessage = `Analyze this ${contractType} contract. Identify every clause, assess risks, and provide counter-proposals.\n\nCONTRACT TEXT:\n${truncatedText}`;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ];

    let responseText = "";
    if (ai.type === "groq") {
      responseText = await callGroq(
        messages,
        process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile",
        0.1,
        4000
      );
    } else {
      responseText = await callZAI(messages);
    }

    const latencyMs = Date.now() - startTime;

    if (!responseText.trim()) {
      throw new Error("Empty response from AI");
    }

    const parsed = extractJson(responseText);

    const sanitizedClauses = Array.isArray(parsed.clauses)
      ? parsed.clauses.map(sanitizeClause).filter((c: any) => c.original_text || c.title)
      : [];

    const overallRisk = Math.max(0, Math.min(100, Math.round(parsed.overall_risk_score || 0)));

    const result: AIAnalysisResult = {
      contract_type: parsed.contract_type || contractType,
      summary: parsed.summary || "No summary available.",
      overall_risk_score: overallRisk,
      detected_language: parsed.detected_language || "en",
      clauses: sanitizedClauses,
      missing_important_clauses: Array.isArray(parsed.missing_important_clauses)
        ? parsed.missing_important_clauses
        : [],
      negotiation_priorities: Array.isArray(parsed.negotiation_priorities)
        ? parsed.negotiation_priorities
        : [],
      immediate_red_flags: Array.isArray(parsed.immediate_red_flags)
        ? parsed.immediate_red_flags
        : [],
    };

    await db.aiAnalysisLog.create({
      data: {
        contractId: contractId || null,
        userId: userId || null,
        modelUsed,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        status: "success",
        taskType: "analysis",
      },
    });

    return result;
  } catch (error) {
    status = "failed";
    errorMessage = error instanceof Error ? error.message : "Unknown error";
    const latencyMs = Date.now() - startTime;

    await db.aiAnalysisLog.create({
      data: {
        contractId: contractId || null,
        userId: userId || null,
        modelUsed,
        latencyMs,
        status: "failed",
        errorMessage,
        taskType: "analysis",
      },
    });

    throw error;
  }
}

export async function generateCounterProposal(
  clauseText: string,
  clauseType: string,
  clauseTitle: string,
  businessContext?: string,
  contractId?: string,
  userId?: string
): Promise<CounterProposalResult> {
  const ai = await getAIClient();
  const startTime = Date.now();
  const modelUsed = process.env.GROQ_API_KEY
    ? (process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile")
    : "z-ai-llm";

  try {
    const userMessage = `Generate a counter-proposal for this contract clause.

Clause Type: ${clauseType}
Clause Title: ${clauseTitle}
Business Context: ${businessContext || "Small business owner signing this contract"}

ORIGINAL CLAUSE TEXT:
${clauseText}

Provide a fair counter-proposal that protects the business owner while being reasonable enough that the other party might accept it.`;

    const messages = [
      { role: "system", content: COUNTER_PROPOSAL_SYSTEM },
      { role: "user", content: userMessage },
    ];

    let responseText = "";
    if (ai.type === "groq") {
      responseText = await callGroq(
        messages,
        process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile",
        0.3,
        800
      );
    } else {
      responseText = await callZAI(messages);
    }

    const latencyMs = Date.now() - startTime;

    if (!responseText.trim()) {
      throw new Error("Empty response from AI");
    }

    const parsed = extractJson(responseText);

    const result: CounterProposalResult = {
      counter_proposal: parsed.counter_proposal || "",
      reasoning: parsed.reasoning || "",
      negotiation_tips: Array.isArray(parsed.negotiation_tips) ? parsed.negotiation_tips : [],
    };

    await db.aiAnalysisLog.create({
      data: {
        contractId: contractId || null,
        userId: userId || null,
        modelUsed,
        latencyMs,
        status: "success",
        taskType: "counter_proposal",
      },
    });

    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db.aiAnalysisLog.create({
      data: {
        contractId: contractId || null,
        userId: userId || null,
        modelUsed,
        latencyMs,
        status: "failed",
        errorMessage,
        taskType: "counter_proposal",
      },
    });

    throw error;
  }
}

export async function generateContractTemplate(
  templateType: string,
  variables: string[],
  jurisdiction: string,
  userId?: string
): Promise<string> {
  const ai = await getAIClient();
  const startTime = Date.now();
  const modelUsed = process.env.GROQ_API_KEY
    ? (process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile")
    : "z-ai-llm";

  const systemPrompt = `You are an expert legal document drafter. Generate a complete, professional contract template.
Use {{variable_name}} placeholders for all fill-in fields (e.g. {{party_a_name}}, {{effective_date}}).
The template should be fair and balanced, suitable for small businesses.
Respond with ONLY the contract text, no explanations or markdown.`;

  const userMessage = `Generate a ${templateType} contract template.

Jurisdiction: ${jurisdiction}
Variables to include as placeholders: ${variables.join(", ")}

Include all standard clauses: parties, effective date, term, payment terms, termination, confidentiality, liability, dispute resolution, governing law, and signatures.`;

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    let responseText = "";
    if (ai.type === "groq") {
      responseText = await callGroq(
        messages,
        process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile",
        0.2,
        3000
      );
    } else {
      responseText = await callZAI(messages);
    }

    const latencyMs = Date.now() - startTime;

    await db.aiAnalysisLog.create({
      data: {
        userId: userId || null,
        modelUsed,
        latencyMs,
        status: "success",
        taskType: "template_generation",
      },
    });

    return responseText || "";
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db.aiAnalysisLog.create({
      data: {
        userId: userId || null,
        modelUsed,
        latencyMs,
        status: "failed",
        errorMessage,
        taskType: "template_generation",
      },
    });

    throw error;
  }
}
