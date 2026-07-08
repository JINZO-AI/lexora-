import React from "react";

type Level = "Low" | "Medium" | "High" | "Critical" | "low" | "medium" | "high" | "critical" | "safe" | "attention" | "warning";

export function RiskBadge({ level, size = "default" }: { level: Level; size?: "sm" | "default" }) {
  // Normalize level to capitalized form
  const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();

  // Use prototype CSS classes (.badge + .risk-*) defined in globals.css
  const riskClassMap: Record<string, string> = {
    Low: "risk-low",
    Safe: "risk-safe",
    Medium: "risk-medium",
    Attention: "risk-attention",
    High: "risk-high",
    Warning: "risk-warning",
    Critical: "risk-critical",
  };

  const label = normalizedLevel === "Safe" ? "Safe" : `${normalizedLevel} Risk`;
  const riskClass = riskClassMap[normalizedLevel] || "risk-medium";

  return (
    <span
      className={`badge ${riskClass} ${normalizedLevel === "Critical" ? "animate-pulse-slow" : ""} ${
        size === "sm" ? "!text-[10px] !px-2 !py-0.5" : ""
      }`}
    >
      {label}
    </span>
  );
}
