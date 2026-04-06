import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getSubscription } from "@/lib/billing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { type } = await req.json(); // "pro" or "autofill"
    const sub = await getSubscription(userId);

    const priceId = type === "pro"
      ? process.env.STRIPE_PRO_PRICE_ID!
      : process.env.STRIPE_AUTOFILL_PRICE_ID!;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: type === "pro" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://redtape-nine.vercel.app'}/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://redtape-nine.vercel.app'}/billing?canceled=true`,
      metadata: { userId },
      client_reference_id: userId,
    };

    if (sub.stripe_customer_id) {
      sessionConfig.customer = sub.stripe_customer_id;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
