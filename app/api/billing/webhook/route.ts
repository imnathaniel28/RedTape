import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { activateProPlan, cancelProPlan, addAutofillCredit } from "@/lib/billing";
import { queryOne } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new NextResponse(`Webhook Error: ${err}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId || session.client_reference_id;
        if (!userId) break;

        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await activateProPlan(userId, session.customer as string, sub.id);
        } else if (session.mode === "payment") {
          // Autofill credit purchase
          await addAutofillCredit(session.customer as string);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const dbSub = await queryOne<{ user_id: string }>(
          "SELECT user_id FROM user_subscriptions WHERE stripe_subscription_id = ?",
          [subscription.id]
        );
        if (dbSub) await cancelProPlan(dbSub.user_id);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.status === "canceled" || subscription.status === "unpaid") {
          const dbSub = await queryOne<{ user_id: string }>(
            "SELECT user_id FROM user_subscriptions WHERE stripe_subscription_id = ?",
            [subscription.id]
          );
          if (dbSub) await cancelProPlan(dbSub.user_id);
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } };
