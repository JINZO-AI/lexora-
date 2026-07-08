"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import {
  User,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Save,
  Loader2,
  Check,
  Lock,
  Crown,
  ArrowRight,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { SUBSCRIPTION_PLANS, formatDate, formatDateTime } from "@/lib/constants";

export function SettingsView() {
  const navigate = useAppStore((s) => s.navigate);
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    companyName: "",
    companySize: "",
    timezone: "UTC",
    preferredLanguage: "en",
    email: "",
  });
  const [stats, setStats] = useState({
    contractsAnalyzedThisMonth: 0,
    monthlyLimit: 5,
    createdAt: "",
    subscriptionPlan: "free",
    subscriptionExpiresAt: null as string | null,
  });

  // Password change state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await api.get<any>("/api/profile");
      setProfile({
        name: res.name || "",
        companyName: res.companyName || "",
        companySize: res.companySize || "",
        timezone: res.timezone || "UTC",
        preferredLanguage: res.preferredLanguage || "en",
        email: res.email,
      });
      setStats({
        contractsAnalyzedThisMonth: res.contractsAnalyzedThisMonth,
        monthlyLimit: res.monthlyLimit,
        createdAt: res.createdAt,
        subscriptionPlan: res.subscriptionPlan,
        subscriptionExpiresAt: res.subscriptionExpiresAt,
      });
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.patch<{ user: any }>("/api/profile", {
        name: profile.name,
        companyName: profile.companyName,
        companySize: profile.companySize,
        timezone: profile.timezone,
        preferredLanguage: profile.preferredLanguage,
      });
      // Update store user
      if (user) {
        setUser({
          ...user,
          name: res.user.name,
        });
      }
      toast.success("Profile updated successfully");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save profile";
      toast.error("Save failed", { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/api/profile/password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPwOpen(false);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to change password";
      toast.error("Password change failed", { description: message });
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const plan = SUBSCRIPTION_PLANS[stats.subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS];

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      <div className="animate-slide-up">
        <h2 className="text-[28px] font-bold tracking-[-0.028em] text-primary">Settings</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="animate-slide-up stagger-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <User className="h-4 w-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[13px] font-medium">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted/50" />
              <p className="text-[11px] text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-[13px] font-medium">Company Name</Label>
              <Input
                id="company"
                value={profile.companyName}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                placeholder="Acme Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size" className="text-[13px] font-medium">Company Size</Label>
              <Select
                value={profile.companySize || "none"}
                onValueChange={(v) => setProfile({ ...profile, companySize: v === "none" ? "" : v })}
              >
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="solo">Solo (just me)</SelectItem>
                  <SelectItem value="small">Small (2-10)</SelectItem>
                  <SelectItem value="medium">Medium (11-50)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (50+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tz" className="text-[13px] font-medium">Timezone</Label>
              <Input
                id="tz"
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                placeholder="UTC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang" className="text-[13px] font-medium">Preferred Language</Label>
              <Select
                value={profile.preferredLanguage}
                onValueChange={(v) => setProfile({ ...profile, preferredLanguage: v })}
              >
                <SelectTrigger id="lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="default" onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="animate-slide-up stagger-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[17px] capitalize text-foreground">{stats.subscriptionPlan} Plan</p>
                {stats.subscriptionPlan !== "free" && <Crown className="h-4 w-4 text-[var(--color-gold)]" />}
              </div>
              <p className="text-[13px] text-muted-foreground">
                {plan?.price ? `$${plan.price}/month` : "Free forever"}
                {stats.subscriptionExpiresAt && ` • Renews ${formatDate(stats.subscriptionExpiresAt)}`}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Current</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border p-4">
              <p className="text-2xl font-bold text-foreground">{stats.contractsAnalyzedThisMonth}</p>
              <p className="text-[11px] text-muted-foreground">Used this month</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-2xl font-bold text-foreground">
                {stats.monthlyLimit === -1 ? "∞" : stats.monthlyLimit}
              </p>
              <p className="text-[11px] text-muted-foreground">Monthly limit</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-2xl font-bold text-foreground">
                {stats.monthlyLimit === -1 ? "∞" : Math.max(0, stats.monthlyLimit - stats.contractsAnalyzedThisMonth)}
              </p>
              <p className="text-[11px] text-muted-foreground">Remaining</p>
            </div>
          </div>

          <Button onClick={() => navigate("billing")} className="w-full gap-2">
            {stats.subscriptionPlan === "free" ? "Upgrade Plan" : "Manage Subscription"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="animate-slide-up stagger-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Analysis complete", desc: "When a contract finishes AI analysis", default: true },
            { label: "Contract expiring soon", desc: "7 days before a contract expires", default: true },
            { label: "Weekly digest", desc: "Summary of your week's activity", default: false },
            { label: "Product updates", desc: "New features and improvements", default: true },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                <p className="text-[12px] text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.default} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="animate-slide-up stagger-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Change password</p>
              <p className="text-[12px] text-muted-foreground">Update your account password</p>
            </div>
            <Dialog open={pwOpen} onOpenChange={setPwOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Change</Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>Enter your current password and a new password</DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cur-pw" className="text-[13px] font-medium">Current Password</Label>
                    <Input
                      id="cur-pw"
                      type="password"
                      required
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pw" className="text-[13px] font-medium">New Password</Label>
                    <Input
                      id="new-pw"
                      type="password"
                      required
                      minLength={6}
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conf-pw" className="text-[13px] font-medium">Confirm New Password</Label>
                    <Input
                      id="conf-pw"
                      type="password"
                      required
                      value={pwForm.confirmPassword}
                      onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
                    <Button variant="default" type="submit" disabled={pwSaving}>
                      {pwSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-foreground">Two-factor authentication</p>
              <p className="text-[12px] text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Badge variant="outline" className="text-[11px]">Coming soon</Badge>
          </div>
          <div className="rounded-xl bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Account info</p>
            <div className="space-y-1 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium text-foreground">{formatDate(stats.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account ID</span>
                <span className="font-mono text-foreground">{user?.id?.slice(0, 12)}...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
