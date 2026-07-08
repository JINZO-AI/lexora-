"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import {
  ArrowLeft,
  Save,
  Loader2,
  Shield,
  Key,
  Server,
  Database,
  Wrench,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  UserPlus,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/constants";

export function AdminSettingsView() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await api.get<any>("/api/admin/settings");
      setSettings(res);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch("/api/admin/settings", settings);
      toast.success("Settings saved successfully");
      loadSettings();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save";
      toast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    try {
      const res = await api.post<{ success: boolean; message: string; latency: number; model: string }>(
        "/api/admin/settings",
        { action: "test_connection" }
      );
      toast.success("Connection successful!", {
        description: `${res.model} • ${res.latency}ms latency`,
      });
    } catch (err) {
      toast.error("Connection failed");
    } finally {
      setTesting(false);
    }
  }

  function updateSetting(key: string, value: any) {
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="animate-slide-up">
        <Button variant="ghost" size="sm" onClick={() => navigate("admin-dashboard")} className="mb-2 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Button>
        <h2 className="text-[28px] font-bold tracking-[-0.028em] text-primary">Admin Settings</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">Platform configuration and controls</p>
      </div>

      {/* AI Configuration */}
      <Card className="animate-slide-up stagger-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <Key className="h-4 w-4 text-primary" />
            AI Engine Configuration
          </CardTitle>
          <CardDescription>Configure the AI model and API settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-[13px] font-medium">Groq API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={settings.groqApiKey}
                  onChange={(e) => updateSetting("groqApiKey", e.target.value)}
                  placeholder="gsk_..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button variant="outline" onClick={handleTestConnection} disabled={testing} className="gap-2">
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Test
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Get your API key from console.groq.com. The key is stored encrypted.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model" className="text-[13px] font-medium">Default Model</Label>
              <Select
                value={settings.groqDefaultModel}
                onValueChange={(v) => updateSetting("groqDefaultModel", v)}
              >
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lexora-ai">Lexora-AI (Recommended)</SelectItem>
                  <SelectItem value="llama-3.3-70b">LLaMA 3.3 70B</SelectItem>
                  <SelectItem value="llama3-8b">LLaMA 3 8B (Fast)</SelectItem>
                  <SelectItem value="mixtral-8x7b">Mixtral 8x7B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-[13px] font-medium">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min={10}
                max={300}
                value={settings.groqTimeout}
                onChange={(e) => updateSetting("groqTimeout", Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Limits */}
      <Card className="animate-slide-up stagger-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <Database className="h-4 w-4 text-primary" />
            Plan Limits
          </CardTitle>
          <CardDescription>Configure monthly analysis limits per plan (-1 = unlimited)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="free-limit" className="text-[13px] font-medium">Free Plan</Label>
              <Input
                id="free-limit"
                type="number"
                value={settings.freePlanLimit}
                onChange={(e) => updateSetting("freePlanLimit", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-limit" className="text-[13px] font-medium">Pro Plan</Label>
              <Input
                id="pro-limit"
                type="number"
                value={settings.proPlanLimit}
                onChange={(e) => updateSetting("proPlanLimit", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-limit" className="text-[13px] font-medium">Business Plan</Label>
              <Input
                id="biz-limit"
                type="number"
                value={settings.businessPlanLimit}
                onChange={(e) => updateSetting("businessPlanLimit", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-file" className="text-[13px] font-medium">Max File Size (MB)</Label>
            <Input
              id="max-file"
              type="number"
              min={1}
              max={100}
              value={settings.maxFileSize}
              onChange={(e) => updateSetting("maxFileSize", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card className="animate-slide-up stagger-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <UserPlus className="h-4 w-4 text-primary" />
            Authentication
          </CardTitle>
          <CardDescription>Control user registration and verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Allow public signup</p>
              <p className="text-[12px] text-muted-foreground">Let anyone create an account</p>
            </div>
            <Switch
              checked={settings.allowPublicSignup}
              onCheckedChange={(v) => updateSetting("allowPublicSignup", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Require email verification</p>
              <p className="text-[12px] text-muted-foreground">New users must verify their email</p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(v) => updateSetting("requireEmailVerification", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className={`animate-slide-up stagger-4 ${settings.maintenanceMode ? "border-[color-mix(in_srgb,var(--color-gold)_40%,transparent)]" : ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <Wrench className="h-4 w-4 text-primary" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Temporarily restrict access to the platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Enable maintenance mode</p>
              <p className="text-[12px] text-muted-foreground">Only admins can access the platform</p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(v) => updateSetting("maintenanceMode", v)}
            />
          </div>
          {settings.maintenanceMode && (
            <div className="space-y-2">
              <Label htmlFor="maint-msg" className="text-[13px] font-medium">Maintenance Message</Label>
              <Input
                id="maint-msg"
                value={settings.maintenanceMessage}
                onChange={(e) => updateSetting("maintenanceMessage", e.target.value)}
                placeholder="We'll be back shortly. Thanks for your patience."
              />
            </div>
          )}
          {settings.maintenanceMode && (
            <div className="flex items-center gap-2 rounded-lg bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)] p-3 text-[12px] text-[var(--color-medium)]">
              <Shield className="h-4 w-4 flex-shrink-0" />
              Maintenance mode is active. Regular users cannot access the platform.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end gap-2 animate-slide-up stagger-5">
        <Button variant="outline" onClick={loadSettings}>Reset</Button>
        <Button variant="default" onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Last updated */}
      {settings.updatedAt && (
        <p className="text-center text-[11px] text-muted-foreground">
          Last updated: {formatDateTime(settings.updatedAt)}
        </p>
      )}
    </div>
  );
}
