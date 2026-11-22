"use client";

import type { DayOpeningHours, Reservation } from "@/types/database";

interface TimeSlotPickerProps {
  dayHours: DayOpeningHours | undefined;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  existingReservations: Reservation[];
  maxTables: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function TimeSlotPicker({
  dayHours,
  selectedSlot,
  onSelectSlot,
  existingReservations,
  maxTables,
}: TimeSlotPickerProps) {
  if (!dayHours || dayHours.closed) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600">
        Le restaurant est fermé à cette date. Veuillez choisir un autre jour.
      </div>
    );
  }

  const startMin = toMinutes(dayHours.open);
  // Dernier créneau de réservation au moins 30 minutes avant la fermeture
  const endMin = toMinutes(dayHours.close) - 30;

  if (endMin < startMin) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600">
        Aucun créneau disponible pour cette journée.
      </div>
    );
  }

  const slots: { time: string; remainingTables: number }[] = [];

  for (let current = startMin; current <= endMin; current += 30) {
    const slotStr = toHHMM(current);
    const activeAtSlot = existingReservations.filter(
      (r) => r.status !== "cancelled" && r.time.slice(0, 5) === slotStr
    ).length;

    slots.push({
      time: slotStr,
      remainingTables: Math.max(0, maxTables - activeAtSlot),
    });
  }

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-800">
        Heure disponible *
      </label>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map(({ time, remainingTables }) => {
          const isFull = remainingTables <= 0;
          const isSelected = selectedSlot === time;

          return (
            <button
              key={time}
              type="button"
              disabled={isFull}
              onClick={() => onSelectSlot(time)}
              className={`rounded-lg border px-2.5 py-2 text-sm font-semibold transition ${
                isFull
                  ? "cursor-not-allowed border-zinc-100 bg-zinc-100 text-zinc-400 line-through"
                  : isSelected
                  ? "border-brand-900 bg-brand-900 text-white shadow-sm"
                  : "border-zinc-200 bg-white text-zinc-900 hover:border-brand-900 hover:bg-brand-50/50"
              }`}
            >
              {time.replace(":", "h")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
