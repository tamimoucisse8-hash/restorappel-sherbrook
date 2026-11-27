"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const DEFAULT_HOURS = {
  lundi: { open: "11:00", close: "21:00", closed: false },
  mardi: { open: "11:00", close: "21:00", closed: false },
  mercredi: { open: "11:00", close: "21:00", closed: false },
  jeudi: { open: "11:00", close: "22:00", closed: false },
  vendredi: { open: "11:00", close: "22:00", closed: false },
  samedi: { open: "12:00", close: "22:00", closed: false },
  dimanche: { open: "12:00", close: "20:00", closed: false },
};

export default function InscriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [restoName, setRestoName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [cuisineType, setCuisineType] = useState("Pizzeria");

  const [maxTables, setMaxTables] = useState(15);
  const [maxPartySize, setMaxPartySize] = useState(8);
  const [openingHours, setOpeningHours] = useState<Record<string, any>>(DEFAULT_HOURS);

  const handleHourChange = (day: string, field: string, value: string | boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw new Error(authError.message);
      const userId = authData.user?.id;
      if (!userId) throw new Error("Impossible de créer le compte utilisateur.");

      await supabase.from("users").upsert({
        id: userId,
        email,
      });

      const slug = `${generateSlug(restoName)}-${Math.floor(100 + Math.random() * 900)}`;

      const { data: restoData, error: restoError } = await supabase
        .from("restaurants")
        .insert({
          user_id: userId,
          name: restoName,
          slug,
          address,
          phone,
          cuisine_type: cuisineType,
          opening_hours: openingHours,
          max_tables: Number(maxTables),
        })
        .select()
        .single();

      if (restoError) throw new Error(restoError.message);

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      if (restoData?.id) {
        await supabase.from("subscriptions").insert({
          restaurant_id: restoData.id,
          plan: "trial",
          status: "trial",
          current_period_end: trialEnd.toISOString(),
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="block text-center text-2xl font-bold text-emerald-900">
          RestoRappel Sherbrooke
        </Link>
        <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
          Créez votre compte restaurant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Essai gratuit de 14 jours • Aucune carte bancaire requise
        </p>

        <div className="mt-6 flex items-center justify-center space-x-2">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-2.5 w-16 rounded-full ${
                step >= num ? "bg-emerald-800" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 border border-gray-200 rounded-2xl shadow-sm">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  Étape 1 : Vos identifiants
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse courriel
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="resto@sherbrooke.ca"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mot de passe (minimum 6 caractères)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-800 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!email || password.length < 6) {
                      setError("Veuillez entrer un courriel valide et un mot de passe d'au moins 6 caractères.");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-900 text-white font-semibold hover:bg-emerald-800 transition"
                >
                  Continuer →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  Étape 2 : Votre restaurant à Sherbrooke
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom du restaurant
                  </label>
                  <input
                    type="text"
                    required
                    value={restoName}
                    onChange={(e) => setRestoName(e.target.value)}
                    placeholder="Ex: Chez Mario Pizzeria"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse à Sherbrooke
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: 120 Rue King Ouest, Sherbrooke, QC"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone du restaurant
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 819-555-0199"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type de cuisine
                  </label>
                  <select
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:border-emerald-800 focus:outline-none"
                  >
                    <option>Pizzeria</option>
                    <option>Casse-croûte</option>
                    <option>Café / Bistro</option>
                    <option>Resto familial</option>
                    <option>Cuisine haïtienne</option>
                    <option>Cuisine africaine</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
