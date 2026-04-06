import { queryOne, execute } from "@/lib/db";

export interface UserSubscription {
  user_id: string;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  searches_used: number;
  autofill_credits: number;
  period_start: string | null;
  period_end: string | null;
}

const FREE_SEARCH_LIMIT = 5;
const PRO_SEARCH_LIMIT = 15;

export async function getSubscription(userId: string): Promise<UserSubscription> {
  let sub = await queryOne<UserSubscription>(
    "SELECT * FROM user_subscriptions WHERE user_id = ?", [userId]
  );
  if (!sub) {
    await execute(
      "INSERT INTO user_subscriptions (user_id, plan, period_start) VALUES (?, 'free', ?)",
      [userId, new Date().toISOString()]
    );
    sub = await queryOne<UserSubscription>(
      "SELECT * FROM user_subscriptions WHERE user_id = ?", [userId]
    );
  }
  return sub!;
}

export async function checkAndIncrementSearch(userId: string): Promise<{ allowed: boolean; reason?: string; searches_used: number; searches_limit: number }> {
  const sub = await getSubscription(userId);
  const limit = sub.plan === 'pro' ? PRO_SEARCH_LIMIT : FREE_SEARCH_LIMIT;

  // Reset if period is over 1 year old
  if (sub.period_start) {
    const periodStart = new Date(sub.period_start);
    const oneYearLater = new Date(periodStart);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    if (new Date() > oneYearLater) {
      await execute(
        "UPDATE user_subscriptions SET searches_used = 0, period_start = ? WHERE user_id = ?",
        [new Date().toISOString(), userId]
      );
      sub.searches_used = 0;
    }
  }

  if (sub.searches_used >= limit) {
    return { allowed: false, reason: sub.plan === 'pro' ? 'Pro search limit reached' : 'Free search limit reached. Upgrade to Pro for more searches.', searches_used: sub.searches_used, searches_limit: limit };
  }

  await execute(
    "UPDATE user_subscriptions SET searches_used = searches_used + 1, updated_at = ? WHERE user_id = ?",
    [new Date().toISOString(), userId]
  );

  return { allowed: true, searches_used: sub.searches_used + 1, searches_limit: limit };
}

export async function checkAutofillAccess(userId: string): Promise<{ allowed: boolean; reason?: string; isPro: boolean; credits: number }> {
  const sub = await getSubscription(userId);
  if (sub.plan === 'pro') {
    return { allowed: true, isPro: true, credits: -1 };
  }
  if (sub.autofill_credits > 0) {
    return { allowed: true, isPro: false, credits: sub.autofill_credits };
  }
  return { allowed: false, reason: 'No autofill credits. Purchase a credit for $1.99 or upgrade to Pro.', isPro: false, credits: 0 };
}

export async function decrementAutofillCredit(userId: string): Promise<void> {
  await execute(
    "UPDATE user_subscriptions SET autofill_credits = autofill_credits - 1, updated_at = ? WHERE user_id = ?",
    [new Date().toISOString(), userId]
  );
}

export async function activateProPlan(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<void> {
  await getSubscription(userId);
  await execute(
    "UPDATE user_subscriptions SET plan = 'pro', stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = ? WHERE user_id = ?",
    [stripeCustomerId, stripeSubscriptionId, new Date().toISOString(), userId]
  );
}

export async function cancelProPlan(userId: string): Promise<void> {
  await execute(
    "UPDATE user_subscriptions SET plan = 'free', stripe_subscription_id = NULL, updated_at = ? WHERE user_id = ?",
    [new Date().toISOString(), userId]
  );
}

export async function addAutofillCredit(stripeCustomerId: string): Promise<void> {
  await execute(
    "UPDATE user_subscriptions SET autofill_credits = autofill_credits + 1, updated_at = ? WHERE stripe_customer_id = ?",
    [new Date().toISOString(), stripeCustomerId]
  );
}

export function getSearchLimit(plan: string): number {
  return plan === 'pro' ? PRO_SEARCH_LIMIT : FREE_SEARCH_LIMIT;
}
