import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscription, getSearchLimit } from "@/lib/billing";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const sub = await getSubscription(userId);
    const limit = getSearchLimit(sub.plan);

    return NextResponse.json({
      success: true,
      data: {
        plan: sub.plan,
        searches_used: sub.searches_used,
        searches_limit: limit,
        searches_remaining: Math.max(0, limit - sub.searches_used),
        autofill_credits: sub.autofill_credits,
        period_start: sub.period_start,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
