import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyPaddleWebhookSignature } from "@/lib/paddle";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";

function mapPaddleStatus(
  eventType: string,
  paddleStatus?: string
): SubscriptionStatus {
  if (
    eventType === "subscription.canceled" ||
    paddleStatus === "canceled" ||
    paddleStatus === "cancelled"
  ) {
    return "cancelled";
  }
  if (
    eventType === "transaction.payment_failed" ||
    paddleStatus === "past_due"
  ) {
    return "past_due";
  }
  if (
    eventType === "subscription.activated" ||
    eventType === "subscription.updated" ||
    eventType === "transaction.completed" ||
    paddleStatus === "active"
  ) {
    return "active";
  }
  if (paddleStatus === "trialing") {
    return "trial";
  }
  return "active";
}

function resolvePlanFromPriceOrCustom(
  priceId?: string,
  customPlan?: string
): SubscriptionPlan {
  if (customPlan === "launch_19" || customPlan === "standard_29") {
    return customPlan;
  }
  if (priceId && process.env.PADDLE_PRICE_ID_19 && priceId === process.env.PADDLE_PRICE_ID_19) {
    return "launch_19";
  }
  return "standard_29";
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paddle-signature");

    if (!verifyPaddleWebhookSignature(rawBody, signatureHeader)) {
      return NextResponse.json(
        { error: "Signature webhook Paddle invalide." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event?.event_type || "";
    const data = event?.data || {};

    const paddleSubscriptionId: string | null =
      data?.subscription_id || (eventType.startsWith("subscription.") ? data?.id : null) || null;
    const paddleCustomerId: string | null = data?.customer_id || null;
    const customData = data?.custom_data || {};
    const restaurantId: string | undefined = customData?.restaurant_id;

    const firstItemPriceId: string | undefined =
      data?.items?.[0]?.price?.id || data?.items?.[0]?.price_id;

    const nextStatus = mapPaddleStatus(eventType, data?.status);
    const nextPlan = resolvePlanFromPriceOrCustom(
      firstItemPriceId,
      customData?.plan
    );

    const periodEndIso: string | undefined =
      data?.current_billing_period?.ends_at ||
      data?.next_billed_at ||
      undefined;

    const adminSupabase = createAdminSupabaseClient();

    // Trouver la ligne d'abonnement existante par restaurant_id ou paddle_subscription_id
    let existingSub: { id: string; restaurant_id: string } | null = null;

    if (restaurantId) {
      const { data: foundByResto } = await adminSupabase
        .from("subscriptions")
        .select("id, restaurant_id")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
      existingSub = foundByResto;
    }

    if (!existingSub && paddleSubscriptionId) {
      const { data: foundBySub } = await adminSupabase
        .from("subscriptions")
        .select("id, restaurant_id")
        .eq("paddle_subscription_id", paddleSubscriptionId)
        .maybeSingle();
      existingSub = foundBySub;
    }

    if (!existingSub) {
      console.warn(
        "Webhook Paddle reçu sans abonnement correspondant:",
        eventType,
        { restaurantId, paddleSubscriptionId }
      );
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const updatePayload: Record<string, unknown> = {
      status: nextStatus,
      plan: nextPlan,
    };

    if (paddleSubscriptionId) {
      updatePayload.paddle_subscription_id = paddleSubscriptionId;
    }
    if (paddleCustomerId) {
      updatePayload.paddle_customer_id = paddleCustomerId;
    }
    if (periodEndIso) {
      updatePayload.current_period_end = periodEndIso;
    }

    const { error: updateError } = await adminSupabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", existingSub.id);

    if (updateError) {
      console.error("Erreur mise à jour abonnement Paddle:", updateError);
      return NextResponse.json(
        { error: "Erreur mise à jour base de données." },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true, status: nextStatus }, { status: 200 });
  } catch (err) {
    console.error("Erreur Webhook Paddle:", err);
    return NextResponse.json(
      { error: "Erreur traitement webhook Paddle." },
      { status: 500 }
    );
  }
}
