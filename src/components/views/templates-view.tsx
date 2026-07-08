"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import {
  Database,
  Search,
  Filter,
  MoreVertical,
  Edit3,
  Trash2,
  Check,
  X,
  Plus,
  Eye,
  Copy,
  Download,
  Loader2,
  ArrowLeft,
  FileText,
  Sparkles,
  Tag,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatDate } from "@/lib/constants";

interface Template {
  id: string;
  title: string;
  description: string | null;
  category: string;
  language: string;
  content: string;
  variables: string[];
  isPublic: boolean;
  usageCount: number;
  isApproved: boolean;
  createdAt: string;
  user: { name: string | null; email: string };
}

function getRiskLevel(category: string): { risk: string; color: string; bg: string } {
  const riskMap: Record<string, { risk: string; color: string; bg: string }> = {
    nda: { risk: "Low", color: "text-emerald-500", bg: "bg-emerald-500" },
    liability: { risk: "High", color: "text-destructive", bg: "bg-destructive" },
    service: { risk: "Low", color: "text-emerald-500", bg: "bg-emerald-500" },
    employment: { risk: "Medium", color: "text-amber-500", bg: "bg-amber-500" },
    lease: { risk: "Medium", color: "text-amber-500", bg: "bg-amber-500" },
    general: { risk: "Low", color: "text-emerald-500", bg: "bg-emerald-500" },
  };
  return riskMap[category] || riskMap.general;
}

export function TemplatesView() {
  const navigate = useAppStore((s) => s.navigate);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [fillVars, setFillVars] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTemplates();
  }, [search, category]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      const res = await api.get<{ templates: Template[] }>(`/api/templates?${params.toString()}`);
      setTemplates(res.templates);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/api/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    }
  }

  function handlePreview(t: Template) {
    setPreviewTemplate(t);
    setFillVars({});
  }

  function getFilledContent(template: Template) {
    let content = template.content;
    for (const [key, value] of Object.entries(fillVars)) {
      content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `{{${key}}}`);
    }
    return content;
  }

  function handleDownload(template: Template) {
    const content = getFilledContent(template);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.title.replace(/[^a-zA-Z0-9-_]/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  }

  function handleCopy(template: Template) {
    navigator.clipboard.writeText(getFilledContent(template));
    toast.success("Copied to clipboard");
  }

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">DataFlow Library</h1>
          <p className="text-muted-foreground">Manage centralized baseline clauses for AI cross-referencing.</p>
        </div>
        <Button onClick={() => navigate("template-new")} className="gap-2">
          <Database className="h-4 w-4" /> Add Clause Variant
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search syntax or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
          />
        </div>
        <select
          value={category || "all"}
          onChange={(e) => setCategory(e.target.value === "all" ? "" : e.target.value)}
          className="px-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm font-medium hover:bg-muted transition cursor-pointer outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Database className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No clauses in library</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground max-w-sm">
              Create your first clause variant to enable AI cross-referencing during contract analysis.
            </p>
            <Button onClick={() => navigate("template-new")} className="gap-2">
              <Plus className="h-4 w-4" /> Add Clause Variant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="glass-panel rounded-2xl border-border/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Clause ID / Name</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Category</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Risk Weighting</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Last Sync</th>
                  <th className="px-6 py-4 text-right font-semibold tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {templates.map((template, idx) => {
                  const riskInfo = getRiskLevel(template.category);
                  return (
                    <tr key={template.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{template.title}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          CL-{String(idx + 1).padStart(2, "0")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                          {template.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase ${riskInfo.color}`}>
                          <div className={`h-2 w-2 rounded-full ${riskInfo.bg}`} />
                          {riskInfo.risk}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {template.isApproved ? (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <Check className="h-4 w-4" /> <span className="text-xs font-medium">Approved</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <X className="h-4 w-4" /> <span className="text-xs font-medium">Requires Review</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
                        {formatDate(template.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => handlePreview(template)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => handleCopy(template)}
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => handleDelete(template.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.title}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="flex-1 overflow-hidden grid md:grid-cols-3 gap-4">
              {/* Variables */}
              <div className="space-y-3 overflow-y-auto scrollbar-thin pr-2">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground">Variables</Label>
                  <p className="text-xs text-muted-foreground mb-3">Fill in values to preview</p>
                </div>
                {previewTemplate.variables.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No variables in this template.</p>
                ) : (
                  previewTemplate.variables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs font-mono">{`{{${v}}}`}</Label>
                      <Input
                        value={fillVars[v] || ""}
                        onChange={(e) => setFillVars({ ...fillVars, [v]: e.target.value })}
                        placeholder={v.replace(/_/g, " ")}
                        className="text-sm"
                      />
                    </div>
                  ))
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleCopy(previewTemplate)}>
                    <Copy className="mr-1 h-3 w-3" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(previewTemplate)}>
                    <Download className="mr-1 h-3 w-3" /> Download
                  </Button>
                </div>
              </div>
              {/* Preview */}
              <div className="md:col-span-2 overflow-y-auto scrollbar-thin rounded-md border bg-[var(--color-surface-offset)] p-4">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed font-mono text-[var(--color-text-muted)]">
                  {getFilledContent(previewTemplate)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template builder view (kept from original, updated with new styling)
export function TemplateBuilderView() {
  const navigate = useAppStore((s) => s.navigate);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "general",
    language: "en",
    content: "",
    isPublic: false,
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genType, setGenType] = useState("nda");

  const extractedVars = Array.from(new Set(
    Array.from(form.content.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1])
  ));

  function insertVariable(varName: string) {
    const textarea = document.getElementById("content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = form.content.substring(0, start) + `{{${varName}}}` + form.content.substring(end);
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + varName.length + 4;
    }, 0);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await api.post<{ content: string }>("/api/templates/generate", {
        templateType: genType,
        variables: [],
        jurisdiction: "United States",
      });
      setForm({ ...form, content: res.content });
      toast.success("Template generated by AI!");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to generate template";
      toast.error("Generation failed", { description: message });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Please enter a title"); return; }
    if (!form.content.trim()) { toast.error("Please enter template content"); return; }
    setSaving(true);
    try {
      await api.post("/api/templates", form);
      toast.success("Template created!");
      navigate("templates");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save template";
      toast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-6 md:p-8">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("templates")} className="mb-3 gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-1">New Clause Variant</h1>
        <p className="text-muted-foreground">Create a reusable clause template for AI cross-referencing</p>
      </div>

      <form onSubmit={handleSave} className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Left: form */}
        <div className="space-y-4 md:col-span-1">
          <Card className="glass-panel">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-[15px] font-semibold">Details</h3>
              <div className="space-y-2">
                <Label htmlFor="t-title" className="text-[13px] font-medium">Title</Label>
                <Input
                  id="t-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Standard Mutual NDA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-desc" className="text-[13px] font-medium">Description</Label>
                <Textarea
                  id="t-desc"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-cat" className="text-[13px] font-medium">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger id="t-cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="nda">Confidentiality</SelectItem>
                    <SelectItem value="service">Financial</SelectItem>
                    <SelectItem value="employment">Employment</SelectItem>
                    <SelectItem value="lease">Term</SelectItem>
                    <SelectItem value="vendor">Liability</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="t-public" className="text-sm">Public</Label>
                <Switch id="t-public" checked={form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
              </div>
            </CardContent>
          </Card>

          {/* AI generate */}
          <Card className="glass-panel">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-[15px] font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Generate
              </h3>
              <Select value={genType} onValueChange={setGenType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="service">Service Agreement</SelectItem>
                  <SelectItem value="employment">Employment Contract</SelectItem>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="vendor">Vendor Agreement</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" className="w-full" onClick={handleGenerate} disabled={generating}>
                {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-4 w-4" />Generate with AI</>}
              </Button>
            </CardContent>
          </Card>

          {/* Variables */}
          <Card className="glass-panel">
            <CardContent className="p-5">
              <h3 className="text-[15px] font-semibold mb-2">Variables Detected</h3>
              <p className="text-xs text-muted-foreground mb-3">Click to insert at cursor</p>
              {extractedVars.length === 0 ? (
                <p className="text-xs text-muted-foreground">Use {"{{variable_name}}"} to create fill-in fields.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {extractedVars.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="rounded-md border bg-muted/50 px-2 py-1 text-xs font-mono hover:bg-accent"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" className="mt-3 text-xs" onClick={() => insertVariable("party_a_name")}>
                + Add variable
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: content editor */}
        <div className="md:col-span-2">
          <Card className="glass-panel h-full">
            <CardContent className="p-5">
              <Label htmlFor="content" className="text-[13px] font-medium mb-2 block">Clause Content</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder={`MUTUAL NON-DISCLOSURE AGREEMENT\n\nThis Agreement is entered into on {{effective_date}} between {{party_a_name}} and {{party_b_name}}...`}
                rows={24}
                className="font-mono text-sm"
              />
              <div className="mt-4 flex gap-2">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Clause Variant"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("templates")}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
