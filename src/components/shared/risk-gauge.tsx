import React from "react";

export function RiskGauge({ score }: { score: number }) {
  // Determine color based on score (0-100, where higher is riskier)
  const isHighRisk = score > 70;
  const isMedium = score > 40 && score <= 70;
  const strokeColor = isHighRisk ? "var(--color-critical)" : isMedium ? "var(--color-medium)" : "var(--color-low)";

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Background Track */}
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle
          strokeWidth="8"
          stroke="var(--color-divider)"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Progress Fill */}
        <circle
          stroke={strokeColor}
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="50"
          cy="50"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            transition: "stroke-dashoffset 1s ease-in-out",
          }}
        />
      </svg>
      {/* Score Text */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold font-mono tracking-tighter" style={{ color: strokeColor }}>
          {score}
        </span>
      </div>
    </div>
  );
}
