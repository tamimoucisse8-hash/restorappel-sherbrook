import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import type { Reservation } from "@/types/database";

interface DailyStatsCardsProps {
  reservations: Reservation[];
}

export default function DailyStatsCards({
  reservations,
}: DailyStatsCardsProps) {
  const totalToday: number = reservations.length;
  const confirmedCount: number = reservations.filter(
    (r: Reservation) => r.status === "confirmed" || r.status === "completed"
  ).length;
  const cancelledCount: number = reservations.filter(
    (r: Reservation) => r.status === "cancelled"
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
