import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  formatCanadianPhoneE164,
  sendBookingConfirmationSms,
} from "@/lib/twilio";
import { formatDateQuebec, formatTimeQuebec } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      restaurant_id,
      customer_name,
      customer_phone,
      date,
      time,
      party_size,
    } = body ?? {};

    if (
      !restaurant_id ||
      !customer_name ||
      !customer_phone ||
      !date ||
      !time ||
      !party_size
    ) {
      return NextResponse.json(
        {
          error:
            "Tous les champs sont requis (nom, téléphone, date, heure et nombre de personnes).",
        },
        { status: 400 }
      );
    }

    const numericParty = Number(party_size);
    if (!Number.isInteger(numericParty) || numericParty < 1) {
      return NextResponse.json(
        { error: "Le nombre de personnes doit être un entier positif." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminSupabaseClient();

    // Vérifier l'existence du restaurant et sa capacité
    const { data: restaurant, error: restoError } = await adminSupabase
      .from("restaurants")
      .select("id, name, max_tables, max_party_size")
      .eq("id", restaurant_id)
      .maybeSingle();

    if (restoError || !restaurant) {
      return NextResponse.json(
        { error: "Restaurant introuvable." },
        { status: 404 }
      );
    }

    if (numericParty > restaurant.max_party_size) {
      return NextResponse.json(
        {
          error: `Ce restaurant accepte au maximum ${restaurant.max_party_size} personnes par réservation en ligne.`,
        },
        { status: 400 }
      );
    }

    const normalizedTime = time.length === 5 ? `${time}:00` : time;
    const normalizedPhone = formatCanadianPhoneE164(String(customer_phone));

    // Vérifier la disponibilité des tables pour ce créneau
    const { data: existingAtSlot } = await adminSupabase
      .from("reservations")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .eq("date", date)
      .eq("time", normalizedTime)
      .neq("status", "cancelled");

    if ((existingAtSlot?.length ?? 0) >= restaurant.max_tables) {
      return NextResponse.json(
        {
          error:
            "Désolé, toutes les tables sont complètes à cette heure. Choisissez un autre créneau.",
        },
        { status: 409 }
      );
    }

    // Insérer la réservation
    const { data: created, error: insertError } = await adminSupabase
      .from("reservations")
      .insert({
        restaurant_id: restaurant.id,
        customer_name: String(customer_name).trim(),
        customer_phone: normalizedPhone,
        date,
        time: normalizedTime,
        party_size: numericParty,
        status: "pending",
        reminder_sent: false,
      })
      .select("*")
      .single();

    if (insertError || !created) {
      console.error("Erreur insertion réservation:", insertError);
      return NextResponse.json(
        { error: "Impossible d'enregistrer la réservation." },
        { status: 500 }
      );
    }

    // SMS 1 : Confirmation immédiate après la réservation
    try {
      await sendBookingConfirmationSms({
        to: normalizedPhone,
        customerName: String(customer_name).trim(),
        partySize: numericParty,
        restaurantName: restaurant.name,
        dateFormatted: formatDateQuebec(date),
        timeFormatted: formatTimeQuebec(normalizedTime),
      });
    } catch (smsError) {
      console.error("Erreur envoi SMS 1 Twilio:", smsError);
      // On ne bloque pas la création de réservation si l'envoi SMS échoue temporairement
    }

    return NextResponse.json({ reservation: created }, { status: 201 });
  } catch (err) {
    console.error("Erreur POST /api/reservations:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de la réservation." },
      { status: 500 }
    );
  }
}
