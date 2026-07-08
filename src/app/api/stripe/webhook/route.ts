import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// POST /api/stripe/webhook - handle Stripe webhooks
// IMPORTANT: This route bypasses middleware (raw body needed)
export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as keyof typeof SUBSCRIPTION_PLANS;
        const billingCycle = session.metadata?.billingCycle;

        if (userId && plan) {
          const planConfig = SUBSCRIPTION_PLANS[plan];
          const now = new Date();
          const expiresAt = new Date(now);
          if (billingCycle === "yearly") {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          await db.user.update({
            where: { id: userId },
            data: {
              subscriptionPlan: plan,
              monthlyLimit: planConfig.monthlyLimit,
              subscriptionExpiresAt: expiresAt,
            },
          });

          await db.notification.create({
            data: {
              userId,
              type: "subscription",
              title: `Upgraded to ${planConfig.name} plan`,
              body: `Your ${planConfig.name} subscription is active. You now have ${planConfig.monthlyLimit === -1 ? "unlimited" : planConfig.monthlyLimit} contract analyses per month.`,
              actionUrl: "dashboard",
            },
          });

          await db.auditLog.create({
            data: {
              userId,
              action: "subscription_activated_stripe",
              entityType: "user",
              entityId: userId,
              newValues: JSON.stringify({ plan, billingCycle, stripeSessionId: session.id }),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          // Update subscription status based on Stripe
          if (subscription.status === "active") {
            const priceId = subscription.items.data[0]?.price?.id;
            // Map price ID back to plan (configure in env)
            const planMapping: Record<string, string> = {
              [process.env.STRIPE_PRICE_PRO_MONTHLY || ""]: "pro",
              [process.env.STRIPE_PRICE_PRO_YEARLY || ""]: "pro",
              [process.env.STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "business",
              [process.env.STRIPE_PRICE_BUSINESS_YEARLY || ""]: "business",
            };
            const newPlan = planMapping[priceId || ""];
            if (newPlan) {
              const planConfig = SUBSCRIPTION_PLANS[newPlan as keyof typeof SUBSCRIPTION_PLANS];
              await db.user.update({
                where: { id: user.id },
                data: {
                  subscriptionPlan: newPlan,
                  monthlyLimit: planConfig.monthlyLimit,
                },
              });
            }
          } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
            await db.user.update({
              where: { id: user.id },
              data: {
                subscriptionPlan: "free",
                monthlyLimit: SUBSCRIPTION_PLANS.free.monthlyLimit,
              },
            });

            await db.notification.create({
              data: {
                userId: user.id,
                type: "subscription",
                title: "Subscription cancelled",
                body: "Your subscription has been cancelled. You're now on the Free plan.",
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: {
              subscriptionPlan: "free",
              monthlyLimit: SUBSCRIPTION_PLANS.free.monthlyLimit,
              subscriptionExpiresAt: null,
            },
          });
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
