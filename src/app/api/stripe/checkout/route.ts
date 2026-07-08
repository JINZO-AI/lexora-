import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// POST /api/stripe/checkout - create Stripe Checkout Session
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { plan, billingCycle } = body; // plan: pro | business, billingCycle: monthly | yearly

  if (!plan || !["pro", "business"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
  if (!planConfig) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  // If no Stripe key configured, return error
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables.",
    }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Define Stripe price IDs (you create these in Stripe Dashboard)
  // Map plan + billingCycle to a Stripe Price ID
  const priceIdMap: Record<string, string> = {
    "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY || "",
    "pro-yearly": process.env.STRIPE_PRICE_PRO_YEARLY || "",
    "business-monthly": process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "",
    "business-yearly": process.env.STRIPE_PRICE_BUSINESS_YEARLY || "",
  };

  const priceKey = `${plan}-${billingCycle}`;
  const priceId = priceIdMap[priceKey];

  if (!priceId) {
    return NextResponse.json({
      error: `Stripe price not configured for ${priceKey}. Set STRIPE_PRICE_${plan.toUpperCase()}_${billingCycle.toUpperCase()} in env.`,
    }, { status: 503 });
  }

  try {
    // Get or create Stripe customer
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    let stripeCustomerId = dbUser?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: dbUser?.name || undefined,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/?checkout=cancelled`,
      metadata: {
        userId: user.id,
        plan,
        billingCycle,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    }, { status: 500 });
  }
}
