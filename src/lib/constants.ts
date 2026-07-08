import type { ClauseRiskLevel, RiskLevel, ContractType, ClauseType } from "@/lib/types";

export const RISK_COLORS: Record<RiskLevel | ClauseRiskLevel, { bg: string; text: string; border: string; hex: string }> = {
  low: { bg: "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]", text: "text-[var(--color-low)]", border: "border-transparent", hex: "#437a22" },
  safe: { bg: "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]", text: "text-[var(--color-low)]", border: "border-transparent", hex: "#437a22" },
  medium: { bg: "bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)]", text: "text-[var(--color-medium)]", border: "border-transparent", hex: "#a16207" },
  attention: { bg: "bg-[color-mix(in_srgb,var(--color-gold)_18%,transparent)]", text: "text-[var(--color-medium)]", border: "border-transparent", hex: "#a16207" },
  high: { bg: "bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)]", text: "text-[var(--color-high)]", border: "border-transparent", hex: "#c2410c" },
  warning: { bg: "bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)]", text: "text-[var(--color-high)]", border: "border-transparent", hex: "#c2410c" },
  critical: { bg: "bg-[color-mix(in_srgb,var(--color-critical)_14%,transparent)]", text: "text-[var(--color-critical)]", border: "border-transparent", hex: "#b42318" },
};

export const RISK_LABELS: Record<string, string> = {
  low: "Low Risk",
  safe: "Safe",
  medium: "Medium Risk",
  attention: "Needs Attention",
  high: "High Risk",
  warning: "Warning",
  critical: "Critical",
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

export function clauseRiskLevelFromScore(score: number): ClauseRiskLevel {
  if (score <= 20) return "safe";
  if (score <= 40) return "attention";
  if (score <= 70) return "warning";
  return "critical";
}

export const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "employment", label: "Employment Agreement" },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { value: "vendor", label: "Vendor Agreement" },
  { value: "service", label: "Service Agreement" },
  { value: "lease", label: "Lease Agreement" },
  { value: "partnership", label: "Partnership Agreement" },
  { value: "custom", label: "Custom / Other" },
];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  employment: "Employment",
  nda: "NDA",
  vendor: "Vendor",
  service: "Service",
  lease: "Lease",
  partnership: "Partnership",
  custom: "Custom",
};

export const CLAUSE_TYPES: { value: ClauseType; label: string }[] = [
  { value: "liability", label: "Liability" },
  { value: "payment", label: "Payment Terms" },
  { value: "termination", label: "Termination" },
  { value: "ip_ownership", label: "IP Ownership" },
  { value: "auto_renewal", label: "Auto-Renewal" },
  { value: "confidentiality", label: "Confidentiality" },
  { value: "dispute_resolution", label: "Dispute Resolution" },
  { value: "warranty", label: "Warranty" },
  { value: "indemnification", label: "Indemnification" },
  { value: "force_majeure", label: "Force Majeure" },
  { value: "other", label: "Other" },
];

export const CLAUSE_TYPE_LABELS: Record<string, string> = {
  liability: "Liability",
  payment: "Payment Terms",
  termination: "Termination",
  ip_ownership: "IP Ownership",
  auto_renewal: "Auto-Renewal",
  confidentiality: "Confidentiality",
  dispute_resolution: "Dispute Resolution",
  warranty: "Warranty",
  indemnification: "Indemnification",
  force_majeure: "Force Majeure",
  other: "Other",
};

export const SUBSCRIPTION_PLANS = {
  free: { name: "Free", monthlyLimit: 5, price: 0 },
  pro: { name: "Pro", monthlyLimit: 50, price: 29 },
  business: { name: "Business", monthlyLimit: -1, price: 99 },
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_FILE_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function daysUntil(date: Date | string | null): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
