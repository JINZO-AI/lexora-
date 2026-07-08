"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api-client";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Zap,
  Sparkles,
  Shield,
  CreditCard,
  Receipt,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDate } from "@/lib/constants";

interface PlanInfo {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyLimit: number;
  isCurrent: boolean;
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "5 contract analyses per month",
    "Basic risk scoring",
    "Plain-English clause explanations",
    "1 user account",
    "Community support",
  ],
  pro: [
    "50 contract analyses per month",
    "Advanced AI counter-proposals",
    "Industry standard comparisons",
    "Contract expiry reminders",
    "HTML report export",
    "Priority email support",
  ],
  business: [
    "Unlimited contract analyses",
    "Everything in Pro",
    "Team collaboration (up to 10 users)",
    "Shared contract links",
    "Custom contract templates",
    "API access",
    "Dedicated account manager",
  ],
};

export function BillingView() {
  const navigate = useAppStore((s) => s.navigate);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await api.get<{ current: any; plans: PlanInfo[] }>("/api/subscription/upgrade");
      setPlans(res.plans);
      setCurrent(res.current);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutPlan) return;
    setProcessing(true);
    try {
      // Try real Stripe checkout first
      try {
        const stripeRes = await api.post<{ url: string }>("/api/stripe/checkout", {
          plan: checkoutPlan.id,
          billingCycle,
        });
        // Redirect to Stripe Checkout
        if (stripeRes.url) {
          window.location.href = stripeRes.url;
          return;
        }
      } catch (stripeErr) {
        // Stripe not configured — fall back to demo mode
        console.log("Stripe not configured, using demo mode");
      }

      // Demo mode fallback
      const res = await api.post<{ success: boolean; receipt: any; user: any }>("/api/subscription/upgrade", {
        plan: checkoutPlan.id,
        billingCycle,
      });
      setReceipt(res.receipt);
      toast.success(`Upgraded to ${checkoutPlan.name} plan!`);
      loadPlans();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Payment failed";
      toast.error("Upgrade failed", { description: message });
    } finally {
      setProcessing(false);
      setCheckoutPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
        <Skeleton className="h-9 w-32" />
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="animate-slide-up">
        <Button variant="ghost" size="sm" onClick={() => navigate("settings")} className="mb-2 gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Button>
        <h2 className="text-[28px] font-bold tracking-[-0.028em] text-primary">Billing & Subscription</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">Choose the plan that fits your business</p>
      </div>

      {/* Current plan status */}
      {current && (
        <Card className="animate-slide-up stagger-1 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-sm">
                  <Crown className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Current Plan</p>
                  <p className="text-[20px] font-bold capitalize text-foreground">{current.plan}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {current.monthlyLimit === -1 ? "Unlimited" : `${current.monthlyLimit}`} analyses/month •
                    {" "}{current.monthlyUsed} used this month
                  </p>
                </div>
              </div>
              {current.expiresAt && (
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Renews On</p>
                  <p className="text-[14px] font-semibold text-foreground">{formatDate(current.expiresAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-3 animate-slide-up stagger-2">
        <span className={`text-[13px] font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>
          Monthly
        </span>
        <button
          onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
          className="relative h-7 w-12 rounded-full bg-secondary transition-colors hover:bg-accent"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-primary shadow-sm transition-transform ${
              billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className={`text-[13px] font-medium ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>
          Yearly
        </span>
        <Badge className="bg-accent/30 text-accent-foreground hover:bg-accent/30 text-[10px]">Save 20%</Badge>
      </div>

      {/* Plans */}
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan, i) => {
          const isCurrent = plan.isCurrent;
          const isPro = plan.id === "pro" || plan.id === "business";
          const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const features = PLAN_FEATURES[plan.id] || [];

          return (
            <Card
              key={plan.id}
              className={`relative animate-slide-up stagger-${i + 1} ${isPro ? "border-primary/30 shadow-md" : ""}`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary shadow-sm">
                    {plan.id === "business" ? "Best Value" : "Popular"}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-[20px] font-bold tracking-tight text-foreground capitalize">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.id === "free" && "For trying out LEXORA"}
                  {plan.id === "pro" && "For growing businesses"}
                  {plan.id === "business" && "For teams that need more"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      ${price}
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {plan.monthlyPrice === 0 ? "forever" : billingCycle === "yearly" ? "/year" : "/month"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                    <p className="mt-1 text-[11px] text-[var(--color-low)]">
                      Save ${plan.monthlyPrice * 12 - plan.yearlyPrice} per year
                    </p>
                  )}
                </div>

                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {plan.monthlyLimit === -1 ? "Unlimited" : plan.monthlyLimit} analyses/month
                  </p>
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-low)]" />
                      <span className="text-[13px] text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={isCurrent ? "outline" : isPro ? "golden" : "default"}
                  className="w-full"
                  disabled={isCurrent}
                  onClick={() => !isCurrent && setCheckoutPlan(plan)}
                >
                  {isCurrent ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      {plan.id === "free" ? "Downgrade" : "Upgrade to " + plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 animate-slide-up stagger-5">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Lock className="h-4 w-4 text-primary" />
          Secure payment processing
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          30-day money-back guarantee
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          Cancel anytime
        </div>
      </div>

      {/* Checkout Dialog (simulated Stripe) */}
      <Dialog open={!!checkoutPlan} onOpenChange={(open) => !open && setCheckoutPlan(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Upgrade to {checkoutPlan?.name}
            </DialogTitle>
            <DialogDescription>
              Complete your upgrade to {checkoutPlan?.name} plan ({billingCycle} billing)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">{checkoutPlan?.name}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Billing</span>
                <span className="font-medium text-foreground capitalize">{billingCycle}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2">
                <span className="text-[14px] font-semibold text-foreground">Total</span>
                <span className="text-[14px] font-bold text-foreground">
                  ${billingCycle === "yearly" ? checkoutPlan?.yearlyPrice : checkoutPlan?.monthlyPrice}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {billingCycle === "yearly" ? "/year" : "/month"}
                  </span>
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="card-name" className="text-[13px] font-medium">Name on Card</Label>
                <Input id="card-name" required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-num" className="text-[13px] font-medium">Card Number</Label>
                <Input id="card-num" required placeholder="4242 4242 4242 4242" maxLength={19} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="exp" className="text-[13px] font-medium">Expiry</Label>
                  <Input id="exp" required placeholder="MM/YY" maxLength={5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc" className="text-[13px] font-medium">CVC</Label>
                  <Input id="cvc" required placeholder="123" maxLength={4} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-[13px] font-medium">ZIP</Label>
                  <Input id="zip" required placeholder="12345" maxLength={10} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-[color-mix(in_srgb,var(--color-gold)_10%,transparent)] p-3 text-[11px] text-[var(--color-medium)]">
              <Lock className="h-3.5 w-3.5 flex-shrink-0" />
              This is a demo checkout. No real payment will be processed. Use any card details to simulate the upgrade.
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCheckoutPlan(null)}>
                Cancel
              </Button>
              <Button variant="golden" type="submit" disabled={processing} className="gap-2">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Pay ${billingCycle === "yearly" ? checkoutPlan?.yearlyPrice : checkoutPlan?.monthlyPrice}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receipt} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--color-low)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]">
                <Check className="h-5 w-5" />
              </div>
              Payment Successful
            </DialogTitle>
            <DialogDescription>Your subscription has been activated</DialogDescription>
          </DialogHeader>
          {receipt && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">Receipt</span>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-foreground">{receipt.transactionId}</span>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{receipt.plan}</span>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-muted-foreground">Billing cycle</span>
                  <span className="font-medium text-foreground capitalize">{receipt.billingCycle}</span>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">${receipt.price} {receipt.currency}</span>
                </div>
                <div className="flex justify-between text-[12.5px] pt-2 border-t">
                  <span className="text-muted-foreground">Valid until</span>
                  <span className="font-medium text-foreground">{formatDate(receipt.expiresAt)}</span>
                </div>
              </div>
              <div className="rounded-xl bg-primary/5 p-3 text-center">
                <p className="text-[12px] text-foreground">
                  <Sparkles className="inline mr-1 h-3.5 w-3.5 text-primary" />
                  You now have {receipt.monthlyLimit === -1 ? "unlimited" : receipt.monthlyLimit} contract analyses per month!
                </p>
              </div>
              <Button variant="golden" className="w-full" onClick={() => { setReceipt(null); navigate("dashboard"); }}>
                Start Analyzing Contracts
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
