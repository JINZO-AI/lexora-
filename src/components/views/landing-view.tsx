"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import {
  Scale,
  FileText,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Lock,
  Globe,
  CheckCircle2,
  Star,
  Quote,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function LandingView() {
  const navigate = useAppStore((s) => s.navigate);
  const setUser = useAppStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
  });

  async function getCsrfToken() {
    const res = await fetch("/api/auth/csrf");
    const data = await res.json();
    return data.csrfToken;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: loginForm.email,
          password: loginForm.password,
          csrfToken: await getCsrfToken(),
          callbackUrl: "/",
          json: "true",
        }),
        credentials: "include",
      });

      if (!result.ok) {
        const data = await result.json().catch(() => ({}));
        throw new Error(data.error || "Invalid credentials");
      }

      const sessionRes = await fetch("/api/auth/session").then((r) => r.json());
      if (sessionRes?.user) {
        setUser(sessionRes.user);
        toast.success("Welcome back!");
        navigate("dashboard");
      } else {
        throw new Error("Failed to get session");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (registerForm.email !== registerForm.confirmEmail) {
      toast.error("Email addresses don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/register", {
        email: registerForm.email,
        password: registerForm.password,
        name: `${registerForm.firstName} ${registerForm.lastName}`.trim(),
      });

      const result = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email: registerForm.email,
          password: registerForm.password,
          csrfToken: await getCsrfToken(),
          callbackUrl: "/",
          json: "true",
        }),
        credentials: "include",
      });

      if (!result.ok) {
        throw new Error("Account created but login failed. Please sign in.");
      }

      const sessionRes = await fetch("/api/auth/session").then((r) => r.json());
      if (sessionRes?.user) {
        setUser(sessionRes.user);
        toast.success("Account created! Welcome to LEXORA.");
        navigate("dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "admin" | "user") {
    if (role === "admin") {
      setLoginForm({ email: "admin@lexora.com", password: "ChangeMeNow!2024" });
    } else {
      setLoginForm({ email: "demo@lexora.com", password: "demo123" });
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ borderColor: "rgba(0,0,0,0.08)", background: "color-mix(in srgb, var(--color-bg) 90%, transparent)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px]" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-blue))", boxShadow: "var(--shadow-md)" }}>
              <Scale className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
            </div>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-[17px] font-semibold tracking-[-0.03em]">LEXORA</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[14px] font-medium transition-colors"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}
            >
              Sign In
            </button>
            <Button
              size="sm"
              onClick={() => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[13px]"
            >
              Get Started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wider" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "var(--color-surface)", color: "var(--color-primary)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--color-primary)" }}></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--color-primary)" }}></span>
                </span>
                AI-Powered Contract Intelligence
              </div>
              <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.035em] mb-6" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                Don't sign a contract you don't understand
              </h1>
              <p className="text-[18px] leading-[1.7] mb-8 max-w-md" style={{ color: "var(--color-text-muted)" }}>
                LEXORA uses AI to analyze contracts in seconds — identifying risky clauses, explaining legal jargon in plain English, and generating counter-proposals that protect your business.
              </p>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  onClick={() => document.getElementById("auth")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-[15px] px-6"
                >
                  Start Free — Analyze 5 Contracts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-1.5 text-[15px] font-medium transition-colors"
                  style={{ color: "var(--color-primary)" }}
                >
                  See How It Works
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-8 flex items-center gap-6 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-success)" }} /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4" style={{ color: "var(--color-success)" }} /> Private & secure
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" style={{ color: "var(--color-success)" }} /> Multi-language
                </span>
              </div>
            </div>

            {/* Right: Product Mockup */}
            <div className="relative">
              <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-lg)", border: "1px solid rgba(0,0,0,0.08)" }}>
                {/* Mockup header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)", background: "var(--color-surface-offset)" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full" style={{ background: "var(--color-critical)" }}></div>
                      <div className="h-3 w-3 rounded-full" style={{ background: "var(--color-gold)" }}></div>
                      <div className="h-3 w-3 rounded-full" style={{ background: "var(--color-success)" }}></div>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                      <span className="text-[12px] font-semibold" style={{ color: "var(--color-text)" }}>ServiceAgreement.pdf</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded" style={{ background: "var(--color-surface-offset)", color: "var(--color-text-muted)" }}>EN</span>
                </div>
                {/* Mockup body */}
                <div className="grid grid-cols-2">
                  <div className="p-4 space-y-2 border-r" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="rounded-lg p-2.5" style={{ background: "color-mix(in srgb, var(--color-critical) 8%, transparent)", borderLeft: "3px solid var(--color-critical)" }}>
                      <p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "var(--color-critical)" }}>Liability • Critical</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>Provider shall not be liable for any indirect damages...</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background: "color-mix(in srgb, var(--color-high) 8%, transparent)", borderLeft: "3px solid var(--color-high)" }}>
                      <p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "var(--color-high)" }}>Payment • Warning</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>Client shall pay all invoices within 15 days...</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background: "color-mix(in srgb, var(--color-gold) 8%, transparent)", borderLeft: "3px solid var(--color-gold)" }}>
                      <p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "var(--color-medium)" }}>Auto-Renewal</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>This agreement renews automatically...</p>
                    </div>
                    <div className="rounded-lg p-2.5" style={{ background: "color-mix(in srgb, var(--color-success) 8%, transparent)", borderLeft: "3px solid var(--color-success)" }}>
                      <p className="text-[9px] font-bold uppercase mb-0.5" style={{ color: "var(--color-low)" }}>Services • Safe</p>
                      <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>Provider will deliver services professionally...</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>Risk Analysis</p>
                    <p className="text-[12px] font-semibold mb-3" style={{ color: "var(--color-text)" }}>AI Assessment Complete</p>
                    {/* Gauge */}
                    <div className="my-4 flex justify-center">
                      <div className="relative flex h-28 w-28 items-center justify-center">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-divider)" strokeWidth="6" />
                          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-high)" strokeWidth="6" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.72)}`}
                            style={{ transition: "stroke-dashoffset 1s ease-out" }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-high)" }}>72</span>
                          <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>/ 100</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="rounded-lg p-2" style={{ border: "1px solid color-mix(in srgb, var(--color-critical) 20%, transparent)", background: "color-mix(in srgb, var(--color-critical) 5%, transparent)" }}>
                        <p className="text-[10px] font-semibold" style={{ color: "var(--color-critical)" }}>Unlimited liability exclusion</p>
                      </div>
                      <div className="rounded-lg p-2" style={{ border: "1px solid color-mix(in srgb, var(--color-high) 20%, transparent)", background: "color-mix(in srgb, var(--color-high) 5%, transparent)" }}>
                        <p className="text-[10px] font-semibold" style={{ color: "var(--color-high)" }}>Short payment window</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b py-12" style={{ borderColor: "rgba(0,0,0,0.08)", background: "var(--color-surface-offset)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { value: "< 10s", label: "Average analysis time" },
            { value: "12+", label: "Clause types detected" },
            { value: "90%", label: "Of SMEs skip legal review" },
            { value: "$300+", label: "Lawyer cost per hour" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-semibold tracking-tight mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}>{stat.value}</div>
              <div className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wider" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "var(--color-surface)", color: "var(--color-primary)" }}>
              Features
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.03em] mb-4" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Everything you need to review contracts with confidence
            </h2>
            <p className="text-[17px] leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>
              Stop signing contracts you haven't fully understood. LEXORA gives you lawyer-level insight without the lawyer-level cost.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: "Instant Risk Scoring", desc: "Get a 0-100 risk score with clause-level breakdown. Know exactly how risky a contract is before you sign." },
              { icon: Sparkles, title: "AI Counter-Proposals", desc: "Don't just identify problems — get suggested replacement text you can send back to negotiate better terms." },
              { icon: FileText, title: "Plain-English Explanations", desc: "Every clause is explained in simple terms. No more guessing what 'indemnification' or 'force majeure' means." },
              { icon: Shield, title: "Clause Highlighting", desc: "Risky clauses are color-coded right on your document. Critical in red, warnings in orange, safe in green." },
              { icon: TrendingUp, title: "Industry Standards", desc: "See how each clause compares to what's considered fair and standard in your industry." },
              { icon: Clock, title: "Expiry Tracking", desc: "Never miss a renewal or expiry deadline. Get reminders before auto-renewals trap you." },
            ].map((feature, i) => (
              <Card key={i} className="p-6" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--shadow-sm)" }}>
                <CardContent className="p-0">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}>
                    <feature.icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} strokeWidth={2} />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>{feature.title}</h3>
                  <p className="text-[14px] leading-[1.65]" style={{ color: "var(--color-text-muted)" }}>{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(0,0,0,0.08)", background: "var(--color-surface-offset)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <Card className="p-10 md:p-12" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--shadow-md)" }}>
            <CardContent className="p-0">
              <Quote className="h-8 w-8 mb-4" style={{ color: "var(--color-primary)", opacity: 0.3 }} />
              <p className="text-[22px] font-medium leading-[1.5] mb-8" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                "LEXORA caught a liability clause that would have cost us over $50,000. It paid for itself in the first contract we analyzed."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{ background: "linear-gradient(135deg, var(--color-gold), var(--color-warning))" }}>MR</div>
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: "var(--color-text)" }}>Marcus Rodriguez</p>
                    <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>CEO, Brightpath Studios</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4" style={{ fill: "var(--color-gold)", color: "var(--color-gold)" }} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Three steps */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-semibold uppercase tracking-wider" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "var(--color-surface)", color: "var(--color-primary)" }}>
              Process
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.03em]" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
              Three steps to a safer contract
            </h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { num: "01", title: "Upload your contract", desc: "Drag and drop PDF, DOCX, or TXT files. Up to 10MB each. Your documents stay private to your account." },
              { num: "02", title: "AI analyzes every clause", desc: "Our AI reads the entire contract, identifies every clause, and scores the risk level of each one." },
              { num: "03", title: "Review & negotiate", desc: "Get plain-English explanations, industry standards, and ready-to-send counter-proposals." },
            ].map((step, i) => (
              <div key={i}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px] text-[16px] font-bold text-white" style={{ background: "var(--color-primary)", boxShadow: "var(--shadow-md)" }}>
                  {step.num}
                </div>
                <h3 className="text-[20px] font-semibold mb-3" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>{step.title}</h3>
                <p className="text-[15px] leading-[1.65]" style={{ color: "var(--color-text-muted)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth section */}
      <section id="auth" className="py-24 border-t" style={{ borderColor: "rgba(0,0,0,0.08)", background: "var(--color-surface-offset)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Left */}
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>
                Get started with LEXORA
              </h2>
              <p className="text-[17px] leading-[1.7] mb-8 max-w-md" style={{ color: "var(--color-text-muted)" }}>
                LEXORA uses AI to analyze contracts in seconds — identifying risky clauses, explaining legal jargon in plain English to protect your business.
              </p>
              <div className="flex items-center gap-4 mb-8">
                <Button size="lg" onClick={() => document.getElementById("register-form")?.scrollIntoView({ behavior: "smooth" })} className="text-[15px]">
                  Sign up
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <button onClick={() => fillDemo("user")} className="flex items-center gap-1 text-[14px] font-medium" style={{ color: "var(--color-primary)" }}>
                  Demo options
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Sign in card */}
              <Card className="p-5" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--shadow-sm)" }}>
                <CardContent className="p-0">
                  <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                    Already have an account? Sign in
                  </p>
                  <form onSubmit={handleLogin} className="space-y-3">
                    <Input
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      placeholder="Email address"
                    />
                    <Input
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      placeholder="Password"
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="flex-1 text-[12px]" onClick={() => fillDemo("admin")}>
                        Admin Demo
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="flex-1 text-[12px]" onClick={() => fillDemo("user")}>
                        User Demo
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right: Register form */}
            <div id="register-form">
              <Card className="p-7" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--shadow-md)" }}>
                <CardContent className="p-0">
                  <h3 className="text-[22px] font-semibold mb-5" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Create your free account</h3>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="firstName" className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>First name</Label>
                        <Input id="firstName" required value={registerForm.firstName} onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })} placeholder="First" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lastName" className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>Last name</Label>
                        <Input id="lastName" required value={registerForm.lastName} onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })} placeholder="Last" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email" className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>Email</Label>
                      <Input id="reg-email" type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="Email address" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-email" className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>Confirm email address</Label>
                      <Input id="confirm-email" type="email" required value={registerForm.confirmEmail} onChange={(e) => setRegisterForm({ ...registerForm, confirmEmail: e.target.value })} placeholder="Confirm email address" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password" className="text-[13px] font-medium" style={{ color: "var(--color-text)" }}>Password</Label>
                      <Input id="reg-password" type="password" required minLength={6} value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="At least 6 characters" />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Sign up"}
                    </Button>
                    <p className="text-center text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                      Free plan includes 5 contract analyses per month
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[12px]" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-blue))" }}>
                <Scale className="h-4 w-4 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-[15px] font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>LEXORA</span>
            </div>
            <div className="flex items-center gap-5 text-[13px]">
              <a href="/privacy" className="transition-colors" style={{ color: "var(--color-text-muted)" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Privacy</a>
              <a href="/terms" className="transition-colors" style={{ color: "var(--color-text-muted)" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Terms</a>
              <a href="/cookies" className="transition-colors" style={{ color: "var(--color-text-muted)" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--color-text)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--color-text-muted)"}>Cookies</a>
            </div>
            <div className="flex items-center gap-5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Private & secure</span>
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Multi-language</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
