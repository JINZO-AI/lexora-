"use client";

import { useState, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import {
  UploadCloud,
  File as FileIcon,
  X,
  CheckCircle2,
  Loader2,
  Cpu,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  CONTRACT_TYPES,
  MAX_FILE_SIZE,
  formatBytes,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "processing" | "complete";

export function ContractUploadView() {
  const navigate = useAppStore((s) => s.navigate);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [form, setForm] = useState({
    title: "",
    contractType: "custom",
    expiresAt: "",
    notes: "",
  });
  const [processingStep, setProcessingStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const processingSteps = [
    { label: "Initializing OCR Engine", icon: Cpu },
    { label: "Extracting clauses and entities", icon: Cpu },
    { label: "Cross-referencing legal library", icon: Cpu },
    { label: "Generating risk assessment", icon: Cpu },
  ];

  const handleFile = useCallback((f: File) => {
    if (f.size > MAX_FILE_SIZE) {
      toast.error("File too large", { description: "Maximum file size is 10MB" });
      return;
    }
    const ext = f.name.split(".").pop()?.toLowerCase();
    const validExt = ["pdf", "docx", "txt"].includes(ext || "");
    if (!validExt) {
      toast.error("Invalid file type", { description: "Only PDF, DOCX, and TXT files are supported" });
      return;
    }
    setFile(f);
    if (!form.title) {
      const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
      setForm((prev) => ({ ...prev, title: nameWithoutExt }));
    }
  }, [form.title]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
    else if (e.type === "dragleave") setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Please select a file"); return; }
    if (!form.title.trim()) { toast.error("Please enter a contract title"); return; }

    setUploadState("processing");

    // Animate processing steps
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < processingSteps.length) {
        setProcessingStep(step);
      } else {
        clearInterval(stepInterval);
      }
    }, 800);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", form.title.trim());
      formData.append("contractType", form.contractType);
      if (form.expiresAt) formData.append("expiresAt", form.expiresAt);
      if (form.notes) formData.append("notes", form.notes);

      const res = await api.upload<{ contract: { id: string }; duplicateWarning: string | null }>(
        "/api/contracts",
        formData
      );

      clearInterval(stepInterval);
      setProcessingStep(processingSteps.length - 1);

      // Brief delay to show "complete" state
      setTimeout(() => {
        setUploadState("complete");
        toast.success("Contract uploaded!", { description: "Starting AI analysis..." });

        // Navigate to analysis page after a moment
        setTimeout(() => {
          navigate("contract-view", { contractId: res.contract.id });
        }, 1500);
      }, 500);
    } catch (err) {
      clearInterval(stepInterval);
      setUploadState("idle");
      const message = err instanceof ApiError ? err.message : "Failed to upload contract";
      toast.error("Upload failed", { description: message });
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-6 md:p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("contracts")} className="mb-3 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Contracts
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Ingest New Contract</h1>
        <p className="text-muted-foreground">Upload documents for automated multi-agent risk analysis.</p>
      </div>

      {uploadState === "idle" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-3xl transition-all duration-300 ease-out bg-card/30 backdrop-blur-sm cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01] shadow-[0_0_40px_-10px_var(--primary)]"
                : "border-border/50 hover:border-border hover:bg-card/50"
            )}
            onClick={() => !file && inputRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <FileIcon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[15px]">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-background rounded-2xl shadow-sm border border-border mb-6">
                  <UploadCloud className={cn("h-10 w-10 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drag & Drop Document Here</h3>
                <p className="text-sm text-muted-foreground mb-6">Supports PDF, DOCX, and TXT up to 10MB</p>

                <div className="flex items-center gap-4 w-full max-w-xs mb-6">
                  <div className="h-px bg-border flex-1" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">OR</span>
                  <div className="h-px bg-border flex-1" />
                </div>

                <Button type="button" className="px-6 py-3">
                  Browse Files
                </Button>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,application/pdf,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Metadata */}
          {file && (
            <Card className="glass-panel">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-[16px] font-semibold mb-2">Contract Details</h3>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[13px] font-medium">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Vendor Agreement with Acme Corp"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-[13px] font-medium">Contract Type</Label>
                    <Select value={form.contractType} onValueChange={(v) => setForm({ ...form, contractType: v })}>
                      <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expires" className="text-[13px] font-medium">Expiry Date (optional)</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-[13px] font-medium">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any context about this contract..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {file && (
            <div className="flex gap-3">
              <Button type="submit" className="flex-1 gap-2" size="lg">
                <UploadCloud className="h-4 w-4" />
                Upload & Analyze
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("contracts")}>
                Cancel
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Processing state */}
      {uploadState === "processing" && (
        <div className="glass-panel p-10 rounded-3xl border-border/40 w-full animate-scale-in">
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full blur-xl bg-primary/30 animate-pulse" />
              <div className="h-20 w-20 bg-card border-2 border-primary rounded-2xl flex items-center justify-center relative z-10">
                <Cpu className="h-10 w-10 text-primary animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">AI Deliberation Engine Active</h2>
            <p className="text-muted-foreground">Parsing {file?.name || "document..."}</p>
          </div>

          <div className="max-w-md mx-auto space-y-4">
            {processingSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-background/50 border border-border/50">
                {index < processingStep ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : index === processingStep ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className={cn(
                  "text-sm font-medium",
                  index < processingStep ? "text-foreground" :
                  index === processingStep ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete state */}
      {uploadState === "complete" && (
        <div className="glass-panel p-10 rounded-3xl border-emerald-500/30 w-full text-center animate-scale-in bg-emerald-500/5">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Document Ingested</h2>
          <p className="text-muted-foreground mb-8">Redirecting to analysis engine...</p>
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
