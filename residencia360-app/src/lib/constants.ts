export const APP_NAME = "Residencia360";
export const RESIDENTIAL_NAME = "Altos de Santa Clara";

export const ROLE_LABELS = {
  RESIDENT: "Residente",
  GUARD: "Vigilante",
  ADMIN: "Administrador",
  BOARD: "Consejo",
  CONTRACTOR: "Proveedor",
} as const;

export const VISIT_STATUS_STYLES = {
  PRE_REGISTERED: "bg-slate-100 text-slate-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  CHECKED_IN: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-slate-900 text-white",
  CANCELLED: "bg-amber-100 text-amber-700",
  REJECTED: "bg-rose-100 text-rose-700",
} as const;

export const PQRS_STATUS_STYLES = {
  FILED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  THIRD_PARTY_PENDING: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-900 text-white",
} as const;

export const RESERVATION_STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-700",
  COMPLETED: "bg-slate-900 text-white",
} as const;
