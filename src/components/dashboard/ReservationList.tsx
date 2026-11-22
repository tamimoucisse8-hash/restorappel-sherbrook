"use client";

import { useState } from "react";
import { CheckCheck, Phone, Users } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatTimeQuebec } from "@/lib/utils";
import type { Reservation, ReservationStatus } from "@/types/database";

interface ReservationListProps {
  initialReservations: Reservation[];
  onStatusChange?: (id: string, nextStatus: ReservationStatus) => void;
}

export default function ReservationList({
  initialReservations,
  onStatusChange,
}: ReservationListProps) {
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

      toast.success(`Réservation de ${reservation.customer_name} marquée comme terminée.`);
      onStatusChange?.(reservation.id, "completed");
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
                <StatusBadge status={r.status} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4 text-zinc-400" />
                  {r.party_size} {r.party_size === 1 ? "personne" : "personnes"}
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
