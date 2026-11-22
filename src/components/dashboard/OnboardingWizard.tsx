"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Store, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { slugifyRestaurantName } from "@/lib/utils";
import type { OpeningHours } from "@/types/database";

const JOURS: { key: keyof OpeningHours; label: string }[] = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

const TYPES_CUISINE = [
  "Pizzeria",
  "Casse-croûte",
  "Café / Bistro",
  "Resto familial",
  "Cuisine haïtienne",
  "Cuisine africaine",
  "Cuisine asiatique",
  "Autre cuisine du monde",
];

const DEFAULT_HOURS: OpeningHours = {
  lundi: { open: "11:00", close: "21:00", closed: false },
  mardi: { open: "11:00", close: "21:00", closed: false },
  mercredi: { open: "11:00", close: "21:00", closed: false },
  jeudi: { open: "11:00", close: "22:00", closed: false },
  vendredi: { open: "11:00", close: "23:00", closed: false },
  samedi: { open: "11:00", close: "23:00", closed: false },
  dimanche: { open: "12:00", close: "21:00", closed: false },
};

export default function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Étape 1 : Infos générales
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cuisineType, setCuisineType] = useState("Resto familial");

  // Étape 2 : Horaires d'ouverture
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS);

  // Étape 3 : Capacité
  const [maxTables, setMaxTables] = useState<number>(12);
  const [maxPartySize, setMaxPartySize] = useState<number>(6);

  const previewSlug = slugifyRestaurantName(name) || "mon-resto-sherbrooke";

  function updateDayHour(
    day: keyof OpeningHours,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  }

  function handleNextStep() {
    if (step === 1) {
      if (!name.trim() || !address.trim() || !phone.trim()) {
        toast.error(
          "Veuillez remplir le nom du restaurant, l'adresse à Sherbrooke et le téléphone."
        );
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();

    if (maxTables < 1 || maxPartySize < 1) {
      toast.error("Le nombre de tables et la taille max par groupe doivent être d'au moins 1.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const baseSlug = slugifyRestaurantName(name);
      const uniqueSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

      const { error } = await supabase.from("restaurants").insert({
        user_id: userId,
        name: name.trim(),
        slug: uniqueSlug,
        address: address.trim(),
        phone: phone.trim(),
        cuisine_type: cuisineType,
        opening_hours: openingHours,
        max_tables: maxTables,
        max_party_size: maxPartySize,
      });

      if (error) {
        toast.error(
          "Impossible d'enregistrer votre restaurant. Veuillez vérifier vos informations."
        );
        setSubmitting(false);
        return;
      }

      toast.success(
        `Votre restaurant est prêt ! Votre lien client : /r/${uniqueSlug}`
      );
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Une erreur inattendue est survenue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Indicateur d'étapes */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
          <span className={step >= 1 ? "text-brand-900" : ""}>
            1. Infos du resto
          </span>
          <span className={step >= 2 ? "text-brand-900" : ""}>
            2. Horaires d&apos;ouverture
          </span>
          <span className={step >= 3 ? "text-brand-900" : ""}>
            3. Tables &amp; groupes
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-brand-900 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-950">
                  Informations de votre restaurant
                </h1>
                <p className="text-sm text-zinc-600">
                  Ces informations s&apos;afficheront sur votre page de réservation client.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800">
                Nom du restaurant *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. : Pizzeria King Ouest"
                className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
              />
              <p className="mt-1.5 text-xs text-zinc-500">
                Votre lien public ressemblera à :{" "}
                <span className="font-mono font-medium text-brand-900">
                  restorappel.com/r/{previewSlug}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800">
                Adresse à Sherbrooke *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex. : 1450 Rue King Ouest, Sherbrooke, QC"
                className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Téléphone du restaurant *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="819-555-0194"
                  className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Type de cuisine *
                </label>
                <select
                  value={cuisineType}
                  onChange={(e) => setCuisineType(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
                >
                  {TYPES_CUISINE.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-900 px-6 text-sm font-bold text-white transition hover:bg-brand-800"
              >
                <span>Étape suivante</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : HORAIRES */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-950">
                  Horaires d&apos;ouverture de la semaine
                </h1>
                <p className="text-sm text-zinc-600">
                  Les clients ne pourront réserver que durant vos heures d&apos;ouverture.
                </p>
              </div>
            </div>

            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
              {JOURS.map(({ key, label }) => {
                const dayConfig = openingHours[key];
                return (
                  <div
                    key={key}
                    className="flex flex-col justify-between gap-3 p-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center justify-between sm:w-44">
                      <span className="text-sm font-semibold text-zinc-900">
                        {label}
                      </span>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-zinc-600">
                        <input
                          type="checkbox"
                          checked={dayConfig.closed}
                          onChange={(e) =>
                            updateDayHour(key, "closed", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-zinc-300 text-brand-900 focus:ring-brand-900"
                        />
                        <span>Fermé</span>
                      </label>
                    </div>

                    {dayConfig.closed ? (
                      <span className="text-xs font-medium italic text-zinc-400">
                        Fermé toute la journée
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="time"
                          value={dayConfig.open}
                          onChange={(e) =>
                            updateDayHour(key, "open", e.target.value)
                          }
                          className="h-9 rounded-md border border-zinc-300 px-2.5 text-sm"
                        />
                        <span className="text-zinc-400">à</span>
                        <input
                          type="time"
                          value={dayConfig.close}
                          onChange={(e) =>
                            updateDayHour(key, "close", e.target.value)
                          }
                          className="h-9 rounded-md border border-zinc-300 px-2.5 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-900 px-6 text-sm font-bold text-white transition hover:bg-brand-800"
              >
                <span>Étape suivante</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : TABLES & CAPACITÉ */}
        {step === 3 && (
          <form onSubmit={handleFinish} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-950">
                  Capacité de votre salle
                </h1>
                <p className="text-sm text-zinc-600">
                  Évitez la surréservation en définissant votre nombre de tables et la taille maximale des groupes.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Nombre de tables *
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  required
                  value={maxTables}
                  onChange={(e) => setMaxTables(Number(e.target.value))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-800">
                  Nombre maximum de personnes par réservation *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={maxPartySize}
                  onChange={(e) => setMaxPartySize(Number(e.target.value))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-zinc-300 px-3.5 text-sm outline-none focus:border-brand-900 focus:ring-2 focus:ring-brand-900/15"
                />
              </div>
            </div>

            <div className="rounded-xl border border-brand-900/15 bg-brand-50/70 p-4 text-sm text-brand-950">
              <p className="font-semibold">
                Votre essai gratuit de 14 jours démarre dès la création :
              </p>
              <p className="mt-1 text-brand-900/80">
                Vous obtiendrez immédiatement votre page publique de réservation et l&apos;envoi automatique des SMS Twilio (confirmation + rappel 3h avant).
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-900 px-6 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {submitting
                    ? "Création en cours..."
                    : "Terminer et ouvrir mon tableau de bord"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
