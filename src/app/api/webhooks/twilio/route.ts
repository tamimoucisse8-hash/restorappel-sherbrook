import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  formatCanadianPhoneE164,
  verifyTwilioWebhookSignature,
} from "@/lib/twilio";

function buildTwimlResponse(message: string): NextResponse {
  const escaped = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;

  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);
    const formObj: Record<string, string> = {};
    params.forEach((value, key) => {
      formObj[key] = value;
    });

    const signature = request.headers.get("x-twilio-signature");
    const webhookUrl =
      process.env.TWILIO_WEBHOOK_URL || request.url;

    // En production, valider la signature Twilio si TWILIO_AUTH_TOKEN est présent
    if (process.env.NODE_ENV === "production") {
      const isValid = verifyTwilioWebhookSignature({
        signature,
        url: webhookUrl,
        formParams: formObj,
      });
      if (!isValid) {
        return new NextResponse("Signature Twilio invalide", { status: 403 });
      }
    }

    const fromPhone = formatCanadianPhoneE164(formObj.From || "");
    const bodyText = (formObj.Body || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

    const isConfirm =
      bodyText === "OUI" || bodyText.startsWith("OUI ");
    const isCancel =
      bodyText === "NON" || bodyText.startsWith("NON ");

    if (!isConfirm && !isCancel) {
      return buildTwimlResponse(
        "Merci de répondre simplement par OUI pour confirmer votre table ou NON pour annuler."
      );
    }

    const adminSupabase = createAdminSupabaseClient();

    // Trouver la réservation active/en attente la plus récente associée à ce numéro
    const { data: reservation } = await adminSupabase
      .from("reservations")
      .select("id, status, date, time, restaurants(name)")
      .eq("customer_phone", fromPhone)
      .in("status", ["pending", "confirmed"])
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!reservation) {
      return buildTwimlResponse(
        "Aucune réservation active trouvée pour ce numéro. Merci de contacter le restaurant."
      );
    }

    const nextStatus = isConfirm ? "confirmed" : "cancelled";

    await adminSupabase
      .from("reservations")
      .update({ status: nextStatus })
      .eq("id", reservation.id);

    const restoRel = reservation.restaurants as
      | { name?: string }
      | { name?: string }[]
      | null;
    const restoName = Array.isArray(restoRel)
      ? restoRel[0]?.name || "le restaurant"
      : restoRel?.name || "le restaurant";

    if (isConfirm) {
      return buildTwimlResponse(
        `Parfait ! Votre table chez ${restoName} est confirmée. À bientôt !`
      );
    }

    return buildTwimlResponse(
      `Votre réservation chez ${restoName} a bien été annulée. Merci de nous avoir prévenus !`
    );
  } catch (err) {
    console.error("Erreur Webhook Twilio:", err);
    return buildTwimlResponse(
      "Désolé, une erreur est survenue lors du traitement de votre réponse."
    );
  }
}
