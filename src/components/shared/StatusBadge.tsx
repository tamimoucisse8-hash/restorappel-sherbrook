import type { ReservationStatus } from "@/types/database";

const STATUS_CONFIG: Record<
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

export default function StatusBadge({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
