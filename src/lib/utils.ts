import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Génère un identifiant URL propre (slug) pour /r/[slug], ex: "Chez Marco Sherbrooke" -> "chez-marco-sherbrooke"
 */
export function slugifyRestaurantName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Formate une date YYYY-MM-DD en français canadien (fuseau America/Toronto).
 */
export function formatDateQuebec(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(date);
}

/**
 * Formate une heure HH:MM ou HH:MM:SS en format lisible (ex: "18h30").
 */
export function formatTimeQuebec(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  if (!hours || !minutes) return timeStr;
  return `${parseInt(hours, 10)}h${minutes}`;
}
