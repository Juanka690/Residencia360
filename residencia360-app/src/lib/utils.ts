import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string, pattern = "dd MMM yyyy") {
  return format(new Date(value), pattern, { locale: es });
}

export function formatDateTime(value: Date | string) {
  return formatDate(value, "dd MMM yyyy, hh:mm a");
}

export function initials(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "R";
}

export function safeSearchParams(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePageParam(value: string | string[] | undefined, fallback = 1) {
  const page = Number(safeSearchParams(value));
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : fallback;
}
