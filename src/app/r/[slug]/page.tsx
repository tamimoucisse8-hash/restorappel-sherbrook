import { notFound } from "next/navigation";
import { Clock, MapPin, Phone, Utensils } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import BookingForm from "@/components/booking/BookingForm";
import type { OpeningHours, Restaurant } from "@/types/database";

const JOURS_ORDRE: { key: keyof OpeningHours; label: string }[] = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

export default async function PublicRestaurantBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!restaurant) {
    notFound();
  }

  const resto = restaurant as Restaurant;

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Colonne gauche : Photo, infos et horaires du restaurant */}
          <div className="space-y-6 lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <img
                src={resto.image_url || "/images/placeholder-resto.jpg"}
                alt={resto.name}
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900">
                  <Utensils className="h-3.5 w-3.5" />
                  {resto.cuisine_type}
                </span>

                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-950">
                  {resto.name}
                </h1>

                <div className="mt-4 space-y-2.5 text-sm text-zinc-600">
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-900" />
                    <span>{resto.address}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-brand-900" />
                    <a
                      href={`tel:${resto.phone}`}
                      className="font-medium text-zinc-800 hover:underline"
                    >
                      {resto.phone}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Horaires d'ouverture */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-950">
                <Clock className="h-4 w-4 text-brand-900" />
                <h2 className="text-base font-bold">Horaires d&apos;ouverture</h2>
              </div>

              <dl className="mt-4 divide-y divide-zinc-100 text-sm">
                {JOURS_ORDRE.map(({ key, label }) => {
                  const h = resto.opening_hours?.[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2"
                    >
                      <dt className="font-medium text-zinc-700">{label}</dt>
                      <dd className="font-semibold text-zinc-950">
                        {!h || h.closed ? (
                          <span className="text-zinc-400">Fermé</span>
                        ) : (
                          `${h.open.replace(":", "h")} – ${h.close.replace(":", "h")}`
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </div>

          {/* Colonne droite : Formulaire de réservation */}
          <div className="lg:col-span-7">
            <BookingForm restaurant={resto} />
          </div>
        </div>
      </div>
    </div>
  );
}
