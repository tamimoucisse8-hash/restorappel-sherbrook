import { formatDateQuebec, formatTimeQuebec } from "@/lib/utils";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Reservation } from "@/types/database";

interface WeeklyCalendarProps {
  reservations: Reservation[];
  days: string[]; // Tableau de 7 dates YYYY-MM-DD
}

export default function WeeklyCalendar({
  reservations,
  days,
}: WeeklyCalendarProps) {
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
                        <StatusBadge status={res.status} />
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
