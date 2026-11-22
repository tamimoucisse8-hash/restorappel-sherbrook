"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  LogOut,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";
type SubscriptionPlan = "trial" | "launch_19" | "standard_29";
type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";

interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  cuisine_type: string;
  max_tables: number;
  max_party_size: number;
}

interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  date: string;
  time: string;
  party_size: number;
  status: ReservationStatus;
}

interface Subscription {
  id: string;
  restaurant_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string;
}

let browserSupabaseInstance: SupabaseClient | null = null;

function getStandaloneSupabase(): SupabaseClient {
  if (!browserSupabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Variables d'environnement Supabase manquantes (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)."
      );
    }

    browserSupabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserSupabaseInstance;
}

function getTorontoDateOffsetISO(offsetDays: number): string {
  const now = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function formatDateQuebec(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTimeQuebec(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  if (!hours || !minutes) return timeStr;
  return `${parseInt(hours, 10)}h${minutes}`;
}

function ReservationStatusBadge({ status }: { status: ReservationStatus }) {
  const config: Record<
    ReservationStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "En attente",
      className: "bg-amber-50 text-amber-800 border-amber-200",
    },
    confirmed: {
      label: "Confirmée",
      className: "bg-brand-50 text-brand-900 border-brand-200",
    },
    cancelled: {
      label: "Annulée",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    completed: {
      label: "Terminée",
      className: "bg-zinc-100 text-zinc-700 border-zinc-200",
    },
  };

  const current = config[status] ?? config.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

function DailyStatsCards({ reservations }: { reservations: Reservation[] }) {
  const totalToday = reservations.length;
  const confirmedCount = reservations.filter(
    (r) => r.status === "confirmed" || r.status === "completed"
  ).length;
  const cancelledCount = reservations.filter(
    (r) => r.status === "cancelled"
  ).length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600">
            Réservations aujourd&apos;hui
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-zinc-950">
          {totalToday}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600">
            Confirmations
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-900">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-brand-900">
          {confirmedCount}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600">
            Annulations
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700">
            <XCircle className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-3xl font-extrabold text-red-700">
          {cancelledCount}
        </p>
      </div>
    </div>
  );
}

function ReservationList({
  initialReservations,
  onStatusChange,
}: {
  initialReservations: Reservation[];
  onStatusChange: (id: string, nextStatus: ReservationStatus) => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleMarkCompleted(reservation: Reservation) {
    setUpdatingId(reservation.id);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!res.ok) {
        toast.error("Impossible de mettre à jour cette réservation.");
        setUpdatingId(null);
        return;
      }

      toast.success(
        `Réservation de ${reservation.customer_name} marquée comme terminée.`
      );
      onStatusChange(reservation.id, "completed");
    } catch {
      toast.error("Erreur réseau lors de la mise à jour.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (initialReservations.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
        <p className="text-base font-semibold text-zinc-900">
          Aucune réservation prévue aujourd&apos;hui
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Partagez votre lien de réservation pour recevoir vos prochaines tables.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-6 py-4">
        <h2 className="text-base font-bold text-zinc-950">
          Réservations d&apos;aujourd&apos;hui
        </h2>
      </div>

      <div className="divide-y divide-zinc-100">
        {initialReservations.map((r) => (
          <div
            key={r.id}
            className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-md bg-zinc-950 px-2.5 py-0.5 text-xs font-bold text-white">
                  {formatTimeQuebec(r.time)}
                </span>
                <span className="text-base font-bold text-zinc-950">
                  {r.customer_name}
                </span>
                <ReservationStatusBadge status={r.status} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4 text-zinc-400" />
                  {r.party_size}{" "}
                  {r.party_size === 1 ? "personne" : "personnes"}
                </span>
                <span className="font-mono text-xs text-zinc-700">
                  {r.customer_phone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <a
                href={`tel:${r.customer_phone}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                <Phone className="h-3.5 w-3.5 text-brand-900" />
                <span>Appeler</span>
              </a>

              {r.status !== "completed" && r.status !== "cancelled" && (
                <button
                  type="button"
                  disabled={updatingId === r.id}
                  onClick={() => handleMarkCompleted(r)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-900 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>
                    {updatingId === r.id ? "En cours..." : "Terminée"}
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyCalendar({
  reservations,
  days,
}: {
  reservations: Reservation[];
  days: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-bold text-zinc-950">
          Calendrier de la semaine
        </h2>
        <p className="text-xs text-zinc-500">
          Aperçu des réservations sur les 7 prochains jours.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {days.map((dayStr) => {
          const dayItems = reservations
            .filter((item) => item.date === dayStr)
            .sort((a, b) => a.time.localeCompare(b.time));

          return (
            <div
              key={dayStr}
              className="flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/60 p-3"
            >
              <div className="border-b border-zinc-200 pb-2">
                <p className="text-xs font-bold capitalize text-zinc-900">
                  {formatDateQuebec(dayStr)}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {dayItems.length}{" "}
                  {dayItems.length === 1 ? "réservation" : "réservations"}
                </p>
              </div>

              <div className="mt-2.5 flex-1 space-y-2">
                {dayItems.length === 0 ? (
                  <p className="py-4 text-center text-xs text-zinc-400">
                    Aucune table
                  </p>
                ) : (
                  dayItems.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-lg border border-zinc-200 bg-white p-2.5 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1 font-bold text-zinc-950">
                        <span>{formatTimeQuebec(res.time)}</span>
                        <span>{res.party_size} pers.</span>
                      </div>
                      <p className="mt-1 truncate font-medium text-zinc-700">
                        {res.customer_name}
                      </p>
                      <div className="mt-1.5">
                        <ReservationStatusBadge status={res.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
      const supabase = getStandaloneSupabase();
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
      prev.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      )
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
    const supabase = getStandaloneSupabase();
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

  const isTrialExpired =
    subscription?.status === "trial" &&
    new Date(subscription.current_period_end).getTime() < Date.now();
  const isBlocked =
    isTrialExpired ||
    subscription?.status === "past_due" ||
    subscription?.status === "cancelled";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
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
        {isBlocked && (
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-red-900">
                Votre période d&apos;essai ou abonnement nécessite une activation
              </h2>
              <p className="mt-1 text-sm text-red-800">
                Vos données et réservations sont conservées. Activez votre
                abonnement Paddle pour continuer à recevoir et confirmer vos
                tables.
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

        <DailyStatsCards reservations={todayReservations} />

        <ReservationList
          initialReservations={todayReservations}
          onStatusChange={handleStatusChange}
        />

        <WeeklyCalendar reservations={weekReservations} days={weekDays} />
      </main>
    </div>
  );
}
