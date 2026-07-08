import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// POST /api/stripe/portal - create Stripe Customer Portal session
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });

  if (!dbUser?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer account found" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to create portal session",
    }, { status: 500 });
  }
}
