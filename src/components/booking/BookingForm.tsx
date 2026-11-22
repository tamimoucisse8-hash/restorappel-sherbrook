"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDateQuebec, formatTimeQuebec } from "@/lib/utils";
import type { OpeningHours, Reservation, Restaurant } from "@/types/database";
import TimeSlotPicker from "./TimeSlotPicker";

const DAY_KEYS_BY_JS_DAY: (keyof OpeningHours)[] = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function getTodayTorontoISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function BookingForm({ restaurant }: { restaurant: Restaurant }) {
  const todayStr = getTodayTorontoISO();

  const [date, setDate] = useState<string>(todayStr);
  const [time, setTime] = useState<string>("");
  const [partySize, setPartySize] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    customerName: string;
    partySize: number;
    date: string;
    time: string;
  } | null>(null);

  // Détermine le jour de la semaine en français à partir de la date sélectionnée
  const selectedDayKey: keyof OpeningHours | undefined = (() => {
    if (!date) return undefined;
    const [y, m, d] = date.split("-").map(Number);
    const utcDate = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
    return DAY_KEYS_BY_JS_DAY[utcDate.getUTCDay()];
  })();

  const dayHours = selectedDayKey
    ? restaurant.opening_hours?.[selectedDayKey]
    : undefined;

  useEffect(() => {
    let active = true;

    async function loadSlots() {
      setLoadingSlots(true);
      setTime("");

      const supabase = createClient();
      const { data } = await supabase
        .from("reservations")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("date", date);

      if (active) {
        setDayReservations((data as Reservation[]) ?? []);
        setLoadingSlots(false);
      }
    }

    if (date) {
      loadSlots();
    }

    return () => {
      active = false;
    };
  }, [date, restaurant.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!date || !time) {
      toast.error("Veuillez choisir une date et une heure disponible.");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Veuillez indiquer votre nom et votre numéro de téléphone.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          date,
          time,
          party_size: partySize,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        toast.error(
          payload?.error ||
            "Impossible d'enregistrer votre réservation. Veuillez réessayer."
        );
        setSubmitting(false);
        return;
      }

      setConfirmedBooking({
        customerName: customerName.trim(),
        partySize,
        date,
        time,
      });
      toast.success("Votre réservation est confirmée !");
    } catch {
      toast.error("Erreur réseau. Veuillez réessayer dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedBooking) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6 text-center sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-white">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-zinc-950">
          Réservation enregistrée !
        </h2>
        <p className="mt-2 text-sm text-zinc-700">
          Merci <strong className="text-zinc-950">{confirmedBooking.customerName}</strong>, votre table pour{" "}
          <strong className="text-zinc-950">{confirmedBooking.partySize} personnes</strong> chez{" "}
          <strong className="text-zinc-950">{restaurant.name}</strong> est prévue le{" "}
          <strong className="text-zinc-950">{formatDateQuebec(confirmedBooking.date)}</strong> à{" "}
          <strong className="text-zinc-950">{formatTimeQuebec(confirmedBooking.time)}</strong>.
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          Un SMS de confirmation vient de vous être envoyé, suivi d&apos;un rappel 3 heures avant votre repas.
        </p>

        <button
          type="button"
          onClick={() => {
            setConfirmedBooking(null);
            setCustomerName("");
            setCustomerPhone("");
            setTime("");
          }}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-900 px-6 text-sm font-bold text-white transition hover:bg-brand-800"
        >
          Faire une autre réservation
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div>
        <h2 className="text-xl font-bold text-zinc-950">
          Réserver une table en 30 secondes
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Aucun compte requis. Confirmation instantanée par SMS.
        </p>
      </div>

      {/* Date & Nombre de personnes */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="booking-date"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-800"
          >
            <Calendar className="h-4 w-4 text-brand-900" />
            <span>Date *</span>
          </label>
          <input
            id="booking-date"
            type="date"
            min={todayStr}
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-950 outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
          />
        </div>

        <div>
          <label
            htmlFor="booking-party"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-800"
          >
            <Users className="h-4 w-4 text-brand-900" />
            <span>Nombre de personnes *</span>
          </label>
          <select
            id="booking-party"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
          >
            {Array.from(
              { length: Math.max(1, restaurant.max_party_size) },
              (_, idx) => idx + 1
            ).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "personne" : "personnes"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Créneaux horaires */}
      {loadingSlots ? (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Chargement des heures disponibles...</span>
        </div>
      ) : (
        <TimeSlotPicker
          dayHours={dayHours}
          selectedSlot={time}
          onSelectSlot={setTime}
          existingReservations={dayReservations}
          maxTables={restaurant.max_tables}
        />
      )}

      {/* Nom & Téléphone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="customer-name"
            className="block text-sm font-medium text-zinc-800"
          >
            Votre nom *
          </label>
          <input
            id="customer-name"
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex. : Sophie Bouchard"
            className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm text-zinc-950 outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
          />
        </div>

        <div>
          <label
            htmlFor="customer-phone"
            className="block text-sm font-medium text-zinc-800"
          >
            Numéro de téléphone (SMS) *
          </label>
          <input
            id="customer-phone"
            type="tel"
            required
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="819-555-0142"
            className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm text-zinc-950 outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || !time}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-900 px-6 text-base font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Confirmation en cours..." : "Réserver"}
      </button>
    </form>
  );
}
