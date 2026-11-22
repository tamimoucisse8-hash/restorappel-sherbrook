"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import {
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateQuebec } from "@/lib/utils";
import type { Restaurant, Subscription } from "@/types/database";

interface SubscriptionManagerProps {
  restaurant: Restaurant;
  subscription: Subscription;
  userEmail: string;
  launchSpotsRemaining: number;
}

const STATUS_LABELS: Record<
  Subscription["status"],
  { label: string; badgeClass: string }
> = {
  trial: {
    label: "Essai gratuit (14 jours)",
    badgeClass: "bg-brand-50 text-brand-900 border-brand-200",
  },
  active: {
    label: "Actif (Payant)",
    badgeClass: "bg-brand-900 text-white border-brand-900",
  },
  past_due: {
    label: "Paiement en retard / Bloqué",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Annulé / Bloqué",
    badgeClass: "bg-zinc-200 text-zinc-800 border-zinc-300",
  },
};

export default function SubscriptionManager({
  restaurant,
  subscription,
  userEmail,
  launchSpotsRemaining,
}: SubscriptionManagerProps) {
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"launch_19" | "standard_29" | null>(
    null
  );
  const [openingPortal, setOpeningPortal] = useState(false);

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const priceId19 = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_19;
  const priceId29 = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_29;

  useEffect(() => {
    if (!clientToken) return;

    initializePaddle({
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
          ? "sandbox"
          : "production",
      token: clientToken,
    })
      .then((instance) => {
        if (instance) setPaddle(instance);
      })
      .catch((err) => {
        console.error("Erreur initialisation Paddle.js:", err);
      });
  }, [clientToken]);

  function handleOpenCheckout(tier: "launch_19" | "standard_29") {
    const selectedPriceId = tier === "launch_19" ? priceId19 : priceId29;

    if (!paddle || !selectedPriceId) {
      toast.error(
        "Paddle Checkout n'est pas encore configuré. Vérifiez vos clés Paddle."
      );
      return;
    }

    setLoadingPlan(tier);

    try {
      paddle.Checkout.open({
        items: [{ priceId: selectedPriceId, quantity: 1 }],
        customer: subscription.paddle_customer_id
          ? { id: subscription.paddle_customer_id }
          : { email: userEmail },
        customData: {
          restaurant_id: restaurant.id,
          plan: tier,
        },
        settings: {
          displayMode: "overlay",
          locale: "fr",
          successUrl: `${window.location.origin}/dashboard/abonnement?checkout=success`,
        },
      });
    } catch {
      toast.error("Impossible d'ouvrir la fenêtre de paiement Paddle.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleOpenPortal() {
    if (!subscription.paddle_customer_id) {
      toast.error(
        "Aucun dossier client Paddle trouvé. Souscrivez d'abord à un forfait."
      );
      return;
    }

    setOpeningPortal(true);
    try {
      const res = await fetch("/api/paddle/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paddleCustomerId: subscription.paddle_customer_id,
          subscriptionId: subscription.paddle_subscription_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.url) {
        toast.error(
          data?.error || "Impossible d'ouvrir le portail de gestion Paddle."
        );
        setOpeningPortal(false);
        return;
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Erreur réseau lors de l'ouverture du portail Paddle.");
    } finally {
      setOpeningPortal(false);
    }
  }

  const statusInfo = STATUS_LABELS[subscription.status] ?? STATUS_LABELS.trial;
  const nextDateFormatted = formatDateQuebec(
    subscription.current_period_end.slice(0, 10)
  );
  const isTrialExpired =
    subscription.status === "trial" &&
    new Date(subscription.current_period_end).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour au tableau de bord</span>
        </Link>
      </div>

      {/* État actuel de l'abonnement */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 pb-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-900">
              {restaurant.name}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-zinc-950">
              Mon Abonnement
            </h1>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full border px-3.5 py-1 text-xs font-bold ${statusInfo.badgeClass}`}
          >
            {isTrialExpired ? "Essai expiré / Bloqué" : statusInfo.label}
          </span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-medium text-zinc-500">Plan actuel</p>
            <p className="mt-1 text-lg font-extrabold text-zinc-950">
              {subscription.plan === "launch_19"
                ? "Offre Lancement — 19 $ CAD / mois"
                : subscription.plan === "standard_29"
                ? "Offre Normale — 29 $ CAD / mois"
                : "Essai gratuit (14 jours)"}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {subscription.status === "trial"
                  ? "Fin de l'essai gratuit"
                  : "Prochain paiement / Échéance"}
              </span>
            </div>
            <p className="mt-1 text-lg font-extrabold text-zinc-950">
              {nextDateFormatted}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Carte &amp; annulation (Paddle)</span>
            </div>
            <button
              type="button"
              onClick={handleOpenPortal}
              disabled={openingPortal || !subscription.paddle_customer_id}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-900 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"
            >
              <span>
                {openingPortal
                  ? "Ouverture..."
                  : "Changer de carte ou annuler"}
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {(isTrialExpired ||
          subscription.status === "past_due" ||
          subscription.status === "cancelled") && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
            <div>
              <p className="font-bold">
                Compte actuellement bloqué — Vos données restent intactes
              </p>
              <p className="mt-0.5 text-red-800">
                Choisissez l&apos;une des offres Paddle ci-dessous pour réactiver immédiatement votre accès complet. Paddle gère la facturation et la TVA canadienne.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cartes de paiement Paddle Checkout : 19 $ CAD et 29 $ CAD */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Offre Lancement : 19 $ CAD / mois */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-brand-900 bg-brand-50/40 p-7">
          <div>
            <div className="inline-flex rounded-full bg-brand-900 px-3 py-1 text-xs font-semibold text-white">
              Offre Lancement ({launchSpotsRemaining} / 20 places restantes)
            </div>
            <h2 className="mt-4 text-xl font-bold text-zinc-950">
              Tarif Lancement Sherbrooke
            </h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-zinc-950">19 $</span>
              <span className="text-sm font-semibold text-zinc-600">
                CAD / mois
              </span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-zinc-800">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-900" />
                <span>Réservations en ligne illimitées, 0 $ commission</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-900" />
                <span>SMS confirmation + rappel automatique 3h avant</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-900" />
                <span>TVA canadienne et factures gérées par Paddle</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={loadingPlan === "launch_19" || launchSpotsRemaining <= 0}
            onClick={() => handleOpenCheckout("launch_19")}
            className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-brand-900 px-5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {launchSpotsRemaining <= 0
              ? "Quota des 20 restos atteint"
              : loadingPlan === "launch_19"
              ? "Ouverture Paddle..."
              : "Payer 19 $ CAD / mois avec Paddle"}
          </button>
        </div>

        {/* Offre Normale : 29 $ CAD / mois */}
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm">
          <div>
            <div className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              Offre Normale
            </div>
            <h2 className="mt-4 text-xl font-bold text-zinc-950">
              Forfait Resto Complet
            </h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-zinc-950">29 $</span>
              <span className="text-sm font-semibold text-zinc-600">
                CAD / mois
              </span>
            </div>
            <ul className="mt-5 space-y-2.5 text-sm text-zinc-800">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-900" />
                <span>Réservations en ligne illimitées, 0 $ commission</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-900" />
                <span>SMS confirmation + rappel automatique 3h avant</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-900" />
                <span>Annulation possible à tout moment via Paddle</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            disabled={loadingPlan === "standard_29"}
            onClick={() => handleOpenCheckout("standard_29")}
            className="mt-7 flex h-12 w-full items-center justify-center rounded-xl border border-zinc-950 bg-white px-5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-50 disabled:opacity-50"
          >
            {loadingPlan === "standard_29"
              ? "Ouverture Paddle..."
              : "Payer 29 $ CAD / mois avec Paddle"}
          </button>
        </div>
      </div>
    </div>
  );
}
