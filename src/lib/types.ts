// LEXORA - Shared Types

export type ContractStatus = "uploaded" | "processing" | "analyzed" | "failed" | "archived";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ClauseRiskLevel = "safe" | "attention" | "warning" | "critical";
export type ContractType =
  | "employment"
  | "nda"
  | "vendor"
  | "service"
  | "lease"
  | "partnership"
  | "custom";

export type ClauseType =
  | "liability"
  | "payment"
  | "termination"
  | "ip_ownership"
  | "auto_renewal"
  | "confidentiality"
  | "dispute_resolution"
  | "warranty"
  | "indemnification"
  | "force_majeure"
  | "other";

export interface ContractWithClauses {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: ContractStatus;
  language: string | null;
  pageCount: number | null;
  wordCount: number | null;
  contractType: ContractType;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  summary: string | null;
  missingClauses: string[] | null;
  negotiationPriorities: string[] | null;
  immediateRedFlags: string[] | null;
  analyzedAt: Date | null;
  expiresAt: Date | null;
  notes: string | null;
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
  clauses?: ContractClauseData[];
}

export interface ContractClauseData {
  id: string;
  contractId: string;
  clauseType: ClauseType;
  title: string;
  originalText: string;
  pageNumber: number | null;
  riskScore: number;
  riskLevel: ClauseRiskLevel;
  riskExplanation: string;
  plainEnglish: string;
  industryStandardClause: string | null;
  suggestedCounterProposal: string | null;
  isReviewedByUser: boolean;
  userNote: string | null;
}

// AI Analysis result shape (from LLM)
export interface AIAnalysisResult {
  contract_type: string;
  summary: string;
  overall_risk_score: number;
  detected_language: string;
  clauses: AIContractClause[];
  missing_important_clauses: string[];
  negotiation_priorities: string[];
  immediate_red_flags: string[];
}

export interface AIContractClause {
  clause_type: string;
  title: string;
  original_text: string;
  page_number: number;
  risk_score: number;
  risk_level: string;
  risk_explanation: string;
  plain_english: string;
  industry_standard_clause: string;
  suggested_counter_proposal: string;
}

export interface CounterProposalResult {
  counter_proposal: string;
  reasoning: string;
  negotiation_tips: string[];
}

// View types for client-side routing
export type ViewName =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "contracts"
  | "contract-new"
  | "contract-view"
  | "templates"
  | "template-new"
  | "settings"
  | "billing"
  | "shared"
  | "agent-terminal"
  | "admin-dashboard"
  | "admin-users"
  | "admin-contracts"
  | "admin-settings";

export interface AppViewState {
  view: ViewName;
  contractId?: string;
  templateId?: string;
  shareToken?: string;
}
