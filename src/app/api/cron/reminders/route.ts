import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendThreeHourReminderSms } from "@/lib/twilio";

/**
 * Convertit une date YYYY-MM-DD et une heure HH:MM:SS en heure de Sherbrooke (America/Toronto)
 * en millisecondes UTC pour comparer avec l'instant présent.
 */
function reservationToUtcMs(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);

  // Estimation UTC puis ajustement selon l'offset réel d'America/Toronto à cette date
  const roughUtc = new Date(
    Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0)
  );
  const torontoOffsetMinutes = getTorontoOffsetMinutes(roughUtc);
  return roughUtc.getTime() - torontoOffsetMinutes * 60 * 1000;
}

function getTorontoOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    timeZoneName: "shortOffset",
  }).formatToParts(date);

  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value || "GMT-5";
  // Exemple : "GMT-5" ou "GMT-4" (heure avancée)
  const match = tzPart.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/i);
  if (!match) return -300;
  const hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + (hours < 0 ? -mins : mins);
}

export async function GET(request: Request) {
  try {
    // Sécurisation optionnelle via CRON_SECRET sur Vercel
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
    }

    const adminSupabase = createAdminSupabaseClient();

    // Récupérer les réservations non rappelées avec statut pending ou confirmed
    const { data: candidates, error } = await adminSupabase
      .from("reservations")
      .select("id, customer_phone, date, time, status, reminder_sent, restaurants(name)")
      .eq("reminder_sent", false)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      console.error("Erreur lecture rappels SMS:", error);
      return NextResponse.json(
        { error: "Erreur base de données" },
        { status: 500 }
      );
    }

    const nowMs = Date.now();
    // Fenêtre cible : entre 2h45 et 3h15 avant l'heure de la réservation
    const minLeadMs = (2 * 60 + 45) * 60 * 1000;
    const maxLeadMs = (3 * 60 + 15) * 60 * 1000;

    let sentCount = 0;

    for (const r of candidates ?? []) {
      const resMs = reservationToUtcMs(r.date, r.time);
      const diffMs = resMs - nowMs;

      if (diffMs >= minLeadMs && diffMs <= maxLeadMs) {
        const restoRel = r.restaurants as
          | { name?: string }
          | { name?: string }[]
          | null;
        const restoName = Array.isArray(restoRel)
          ? restoRel[0]?.name || "votre restaurant"
          : restoRel?.name || "votre restaurant";

        try {
          await sendThreeHourReminderSms({
            to: r.customer_phone,
            restaurantName: restoName,
          });

          await adminSupabase
            .from("reservations")
            .update({ reminder_sent: true })
            .eq("id", r.id);

          sentCount += 1;
        } catch (smsErr) {
          console.error(`Erreur envoi SMS 2 réservation ${r.id}:`, smsErr);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      remindersSent: sentCount,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Erreur Cron rappels 3h:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'exécution du cron." },
      { status: 500 }
    );
  }
}
