"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, CreditCard, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import DailyStatsCards from "@/components/dashboard/DailyStatsCards";
import ReservationList from "@/components/dashboard/ReservationList";
import WeeklyCalendar from "@/components/dashboard/WeeklyCalendar";
import type {
  Reservation,
  ReservationStatus,
  Restaurant,
  Subscription,
} from "@/types/database";

function getTorontoDateOffsetISO(offsetDays: number): string {
  const now = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [weekReservations, setWeekReservations] = useState<Reservation[]>([]);

  const todayISO = getTorontoDateOffsetISO(0);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    getTorontoDateOffsetISO(i)
  );
  const endWeekISO = weekDays[weekDays.length - 1];

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const supabase = createClient();
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
        .maybeSingle();

      if (!resto) {
        router.push("/dashboard/onboarding");
        return;
      }

      if (!active) return;
      setRestaurant(resto as Restaurant);

      const [{ data: sub }, { data: reservations }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("*")
          .eq("restaurant_id", resto.id)
          .maybeSingle(),
        supabase
          .from("reservations")
          .select("*")
          .eq("restaurant_id", resto.id)
          .gte("date", todayISO)
          .lte("date", endWeekISO)
          .order("time", { ascending: true }),
      ]);

      if (!active) return;
      setSubscription((sub as Subscription) ?? null);
      setWeekReservations((reservations as Reservation[]) ?? []);
      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [router, todayISO, endWeekISO]);

  function handleStatusChange(id: string, nextStatus: ReservationStatus) {
    setWeekReservations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  }

  function handleCopyLink() {
    if (!restaurant) return;
    const url = `${window.location.origin}/r/${restaurant.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lien de réservation copié !");
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/connexion");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">
        Chargement de votre tableau de bord...
      </div>
    );
  }

  if (!restaurant) return null;

  const todayReservations = weekReservations
    .filter((r) => r.date === todayISO)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Vérification si l'essai de 14 jours est expiré ou abonnement impayé/annulé
  const isTrialExpired =
    subscription?.status === "trial" &&
    new Date(subscription.current_period_end).getTime() < Date.now();
  const isBlocked =
    isTrialExpired ||
    subscription?.status === "past_due" ||
    subscription?.status === "cancelled";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      {/* Barre supérieure du tableau de bord */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-900">
              Tableau de bord restaurateur
            </p>
            <h1 className="text-xl font-extrabold text-zinc-950">
              {restaurant.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand-900" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-zinc-600" />
              )}
              <span>/r/{restaurant.slug}</span>
            </button>

            <Link
              href={`/r/${restaurant.slug}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              <span>Voir page client</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/dashboard/abonnement"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-900 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-800"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Mon Abonnement</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {/* Bandeau de blocage si essai expiré / paiement en retard (données conservées) */}
        {isBlocked && (
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-red-900">
                Votre période d&apos;essai ou abonnement nécessite une activation
              </h2>
              <p className="mt-1 text-sm text-red-800">
                Vos données et réservations sont conservées. Activez votre abonnement Paddle pour continuer à recevoir et confirmer vos tables.
              </p>
            </div>
            <Link
              href="/dashboard/abonnement"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-800"
            >
              Activer mon abonnement
            </Link>
          </div>
        )}

        {/* 1. Les 3 chiffres du jour */}
        <DailyStatsCards reservations={todayReservations} />

        {/* 2. Liste des réservations d'aujourd'hui */}
        <ReservationList
          initialReservations={todayReservations}
          onStatusChange={handleStatusChange}
        />

        {/* 3. Calendrier de la semaine */}
        <WeeklyCalendar reservations={weekReservations} days={weekDays} />
      </main>
    </div>
  );
}
