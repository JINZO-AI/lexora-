"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  Terminal,
  Cpu,
  Network,
  Activity,
  ArrowLeft,
  FileSearch,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const agents = [
  { id: "ag-legal", name: "Lex-Parser-Alpha", role: "Syntax & Clause Extraction", color: "text-emerald-500", bg: "bg-emerald-500", bgColor: "bg-emerald-500/10" },
  { id: "ag-risk", name: "Risk-Sentinel-V2", role: "Liability Routing", color: "text-amber-500", bg: "bg-amber-500", bgColor: "bg-amber-500/10" },
  { id: "ag-fin", name: "Quant-Oracle", role: "Financial Exposure", color: "text-primary", bg: "bg-primary", bgColor: "bg-primary/10" },
];

const initialLogs = [
  { agent: "System", message: "Initiating AGORA-style deliberation protocol...", time: "00:00.01", color: "text-[var(--color-blue)]" },
  { agent: "Lex-Parser-Alpha", message: "Ingesting document. Extracting entities and clause boundaries.", time: "00:00.45", color: "text-[var(--color-success)]" },
  { agent: "Lex-Parser-Alpha", message: "Found 14 clause candidates. Routing to Risk-Sentinel-V2.", time: "00:01.02", color: "text-[var(--color-success)]" },
  { agent: "Risk-Sentinel-V2", message: "Analyzing liability exposure on clause 7.1 (Indemnification)...", time: "00:01.15", color: "text-[var(--color-gold)]" },
  { agent: "Risk-Sentinel-V2", message: "FLAG: Unilateral indemnification detected. Severity: HIGH.", time: "00:01.28", color: "text-[var(--color-gold)]" },
  { agent: "Quant-Oracle", message: "Calculating financial exposure for open-ended liability...", time: "00:01.35", color: "text-[var(--color-primary)]" },
  { agent: "Quant-Oracle", message: "Estimated exposure: $250K-$1.2M based on historical claim data.", time: "00:01.42", color: "text-[var(--color-primary)]" },
  { agent: "Risk-Sentinel-V2", message: "Cross-referencing with market standard clauses...", time: "00:01.50", color: "text-[var(--color-gold)]" },
  { agent: "Lex-Parser-Alpha", message: "Generating counter-proposal draft for clause 7.1...", time: "00:02.01", color: "text-[var(--color-success)]" },
  { agent: "System", message: "Consensus reached. 3 risks identified, 2 counter-proposals generated.", time: "00:02.15", color: "text-[var(--color-blue)]" },
];

export function AgentTerminalView() {
  const navigate = useAppStore((s) => s.navigate);
  const [logs, setLogs] = useState(initialLogs);
  const [visibleLogs, setVisibleLogs] = useState(0);

  // Animate logs appearing one by one
  useEffect(() => {
    if (visibleLogs < logs.length) {
      const timer = setTimeout(() => {
        setVisibleLogs((prev) => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visibleLogs, logs.length]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("dashboard")} className="mb-2 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Agent Deliberation Terminal</h1>
          <p className="text-muted-foreground">Real-time visualization of multi-agent AI consensus protocol.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Network Topology Visualization */}
        <div className="xl:w-1/3 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl border-border/40 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <Network className="h-5 w-5 text-primary" />
              <h2 className="font-semibold tracking-tight">Active Node Topology</h2>
            </div>

            <div className="space-y-4 relative">
              {/* Connecting Line */}
              <div className="absolute left-[27px] top-10 bottom-10 w-0.5 bg-border z-0" />

              {agents.map((agent) => (
                <div key={agent.id} className="relative z-10 flex items-start gap-4 p-3 rounded-xl hover:bg-card/50 transition-colors border border-transparent hover:border-border/50">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border border-border bg-card shadow-sm ${agent.color}`}>
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agent.bg}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${agent.bg}`}></span>
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Processing</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Metrics */}
          <div className="glass-panel p-6 rounded-2xl border-border/40 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Inference Latency</div>
              <div className="text-xl font-bold font-mono">42ms</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tokens/Sec</div>
              <div className="text-xl font-bold font-mono text-primary">124.5</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Agents Active</div>
              <div className="text-xl font-bold font-mono text-emerald-500">3/3</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Consensus</div>
              <div className="text-xl font-bold font-mono text-emerald-500">Reached</div>
            </div>
          </div>
        </div>

        {/* Live Deliberation Log */}
        <div className="flex-1 glass-panel rounded-2xl border-border/40 flex flex-col overflow-hidden">
          <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-card/30">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold tracking-tight">Consensus Output</h2>
            </div>
            <Activity className="h-4 w-4 text-primary animate-pulse" />
          </div>

          <div className="flex-1 bg-[var(--color-surface-offset)] p-6 overflow-y-auto scrollbar-thin font-mono text-sm min-h-[400px] text-[var(--color-text)] border-y border-border/50">
            {logs.slice(0, visibleLogs).map((log, i) => (
              <div key={i} className="mb-3 flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="text-[var(--color-text-muted)] shrink-0 w-16">[{log.time}]</span>
                <span className={log.color}>
                  {log.agent}:
                </span>
                <span className="text-[var(--color-text)]">{log.message}</span>
              </div>
            ))}

            {/* Typing indicator */}
            {visibleLogs < logs.length && (
              <div className="flex gap-4 items-center mt-4">
                <span className="text-[var(--color-text-muted)] w-16">[00:02.x]</span>
                <span className="text-[var(--color-gold)]">Risk-Sentinel-V2:</span>
                <span className="flex gap-1">
                  <div className="h-1.5 w-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 bg-[var(--color-gold)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            )}

            {/* Completion indicator */}
            {visibleLogs >= logs.length && (
              <div className="mt-4 flex items-center gap-2 text-[var(--color-success)] animate-in fade-in duration-500">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Deliberation complete. Results delivered to analysis engine.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
