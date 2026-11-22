"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [copied, setCopied] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/connexion");
      return;
    }

    const { data: resto } = await supabase
      .from("restaurants")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!resto) {
      router.push("/inscription");
      return;
    }

    setRestaurant(resto);

    const { data: resData } = await supabase
      .from("reservations")
      .select("*")
      .eq("restaurant_id", resto.id)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    setReservations(resData || []);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase
      .from("reservations")
      .update({ status: newStatus })
      .eq("id", id);

    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600 font-medium">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  const todayReservations = reservations.filter((r) => r.date === todayStr);
  const totalToday = todayReservations.length;
  const confirmedToday = todayReservations.filter(
    (r) => r.status === "confirmed" || r.status === "Confirmée"
  ).length;
  const cancelledToday = todayReservations.filter(
    (r) => r.status === "cancelled" || r.status === "Annulée"
  ).length;

  const publicUrl =
    typeof window !== "undefined" && restaurant
      ? `${window.location.origin}/r/${restaurant.slug}`
      : "";

  const copyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Calcul des 7 prochains jours pour le calendrier hebdomadaire
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("fr-CA", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const count = reservations.filter((r) => r.date === iso).length;
    return { iso, label, count };
  });

  const formatStatus = (status: string) => {
    switch (status) {
      case "confirmed":
      case "Confirmée":
        return { label: "Confirmée", color: "bg-emerald-100 text-emerald-900" };
      case "cancelled":
      case "Annulée":
        return { label: "Annulée", color: "bg-red-100 text-red-800" };
      case "completed":
      case "Terminée":
        return { label: "Terminée", color: "bg-gray-100 text-gray-700" };
      default:
        return { label: "En attente", color: "bg-amber-100 text-amber-900" };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre supérieure */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
            <p className="text-xs text-gray-500">{restaurant?.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/abonnement"
              className="text-sm font-medium text-emerald-900 hover:underline"
            >
              Mon abonnement
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Lien de réservation à partager aux clients */}
        <div className="bg-emerald-950 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
              Votre page publique de réservation
            </p>
            <p className="text-sm mt-1 break-all text-emerald-50">{publicUrl}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-lg bg-white text-emerald-950 text-sm font-semibold hover:bg-emerald-50"
            >
              {copied ? "Lien copié !" : "Copier le lien"}
            </button>
            {restaurant && (
              <Link
                href={`/r/${restaurant.slug}`}
                target="_blank"
                className="px-4 py-2 rounded-lg border border-emerald-700 text-white text-sm font-medium hover:bg-emerald-900"
              >
                Ouvrir
              </Link>
            )}
          </div>
        </div>

        {/* 1. Cartes statistiques du jour */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500">Réservations aujourd&apos;hui</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalToday}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500">Confirmées par SMS</p>
            <p className="text-3xl font-bold text-emerald-800 mt-2">{confirmedToday}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500">Annulations</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{cancelledToday}</p>
          </div>
        </div>

        {/* 2. Liste des réservations d'aujourd'hui */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Réservations d&apos;aujourd&apos;hui ({todayStr})
            </h2>
          </div>

          {todayReservations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              Aucune réservation prévue pour aujourd&apos;hui. Partagez votre lien client pour recevoir vos premières tables !
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {todayReservations.map((res) => {
                const badge = formatStatus(res.status);
                return (
                  <div
                    key={res.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-gray-900">
                          {res.time}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {res.customer_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          • {res.party_size} pers.
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{res.customer_phone}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <a
                        href={`tel:${res.customer_phone}`}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Appeler
                      </a>
                      {res.status !== "completed" && res.status !== "Terminée" && (
                        <button
                          onClick={() => updateStatus(res.id, "completed")}
                          className="px-3 py-1.5 rounded-lg bg-emerald-900 text-white text-xs font-medium hover:bg-emerald-800"
                        >
                          Marquer terminée
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

