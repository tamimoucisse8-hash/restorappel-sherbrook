import crypto from "crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { SubscriptionPlan } from "@/types/database";

const PADDLE_API_BASE =
  process.env.PADDLE_ENV === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

export interface SelectedPaddleOffer {
  plan: Exclude<SubscriptionPlan, "trial">;
  priceId: string;
  amountCad: 19 | 29;
  isLaunchOffer: boolean;
}

/**
 * Détermine si l'offre de lancement à 19 $ CAD/mois est encore disponible
 * (réservée aux 20 premiers restaurants ayant un abonnement actif).
 */
export async function resolvePaddlePriceForRestaurant(): Promise<SelectedPaddleOffer> {
  const price19 = process.env.PADDLE_PRICE_ID_19;
  const price29 = process.env.PADDLE_PRICE_ID_29;

  if (!price19 || !price29) {
    throw new Error(
      "Les identifiants de prix Paddle (PADDLE_PRICE_ID_19 et PADDLE_PRICE_ID_29) doivent être configurés."
    );
  }

  const supabaseAdmin = createAdminSupabaseClient();
  const { count, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    console.error("Erreur vérification quota offre lancement Paddle:", error);
    return {
      plan: "standard_29",
      priceId: price29,
      amountCad: 29,
      isLaunchOffer: false,
    };
  }

  const activeCount = count ?? 0;

  if (activeCount < 20) {
    return {
      plan: "launch_19",
      priceId: price19,
      amountCad: 19,
      isLaunchOffer: true,
    };
  }

  return {
    plan: "standard_29",
    priceId: price29,
    amountCad: 29,
    isLaunchOffer: false,
  };
}

/**
 * Prépare les paramètres de checkout Paddle pour un restaurant donné.
 * Utilisable avec Paddle.js côté client ou l'API Paddle côté serveur.
 */
export async function createPaddleCheckout(params: {
  restaurantId: string;
  customerEmail: string;
  paddleCustomerId?: string | null;
}) {
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!clientToken) {
    throw new Error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN est manquant.");
  }

  const offer = await resolvePaddlePriceForRestaurant();

  return {
    clientToken,
    priceId: offer.priceId,
    plan: offer.plan,
    amountCad: offer.amountCad,
    isLaunchOffer: offer.isLaunchOffer,
    customerEmail: params.customerEmail,
    customerId: params.paddleCustomerId ?? undefined,
    customData: {
      restaurant_id: params.restaurantId,
      plan: offer.plan,
    },
  };
}

/**
 * Crée une session portail client Paddle (pour changer de carte ou annuler l'abonnement).
 */
export async function createPaddleCustomerPortalSession(
  paddleCustomerId: string,
  subscriptionIds: string[] = []
): Promise<string> {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY est manquant dans les variables d'environnement.");
  }

  const response = await fetch(
    `${PADDLE_API_BASE}/customers/${paddleCustomerId}/portal-sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_ids: subscriptionIds,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Paddle (portail client): ${errorText}`);
  }

  const data = await response.json();
  const portalUrl: string | undefined =
    data?.data?.urls?.general?.overview ?? data?.data?.urls?.cancel;

  if (!portalUrl) {
    throw new Error("URL du portail client Paddle introuvable dans la réponse.");
  }

  return portalUrl;
}

/**
 * Vérifie la signature d'un webhook Paddle (`Paddle-Signature: ts=...;h1=...`).
 */
export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(";");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const h1Part = parts.find((p) => p.startsWith("h1="));

  if (!tsPart || !h1Part) {
    return false;
  }

  const timestamp = tsPart.replace("ts=", "");
  const receivedHash = h1Part.replace("h1=", "");

  // Protection contre les attaques par rejeu (tolérance de 5 minutes)
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (Number.isNaN(ageSeconds) || ageSeconds > 300) {
    return false;
  }

  const signedPayload = `${timestamp}:${rawBody}`;
  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const receivedBuf = Buffer.from(receivedHash, "utf8");
  const computedBuf = Buffer.from(computedHash, "utf8");

  if (receivedBuf.length !== computedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuf, computedBuf);
}
