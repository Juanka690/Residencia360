import type { PqrsPriority, PqrsStatus, VisitStatus } from "@prisma/client";

export type DomainEventName =
  | "VisitaPreRegistrada"
  | "VisitaAprobada"
  | "VisitaRechazada"
  | "VisitaCancelada"
  | "VisitaIngresada"
  | "VisitaFinalizada"
  | "PqrsRadicada"
  | "PqrsAsignada"
  | "PqrsResuelta"
  | "PqrsCerrada"
  | "PqrsReabierta"
  | "PqrsSlaPorVencer"
  | "ReservaCreada"
  | "ReservaAprobada"
  | "ReservaRechazada"
  | "ComunicadoPublicado"
  | "PagoEnviado"
  | "PagoAprobado"
  | "PagoRechazado"
  | "PasswordResetSolicitado";

export interface DomainEvent<T = unknown> {
  name: DomainEventName;
  occurredAt: Date;
  actorId?: string | null;
  payload: T;
}

export type VisitaPayload = {
  visitId: string;
  code: string;
  residentId: string;
  apartmentLabel?: string;
  visitorName: string;
  status: VisitStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
};

export type PqrsPayload = {
  pqrsId: string;
  ticketNumber: string;
  residentId: string;
  assignedToId?: string | null;
  priority: PqrsPriority;
  status: PqrsStatus;
  slaDueAt: Date;
  subject: string;
};

export type ReservaPayload = {
  reservationId: string;
  areaName: string;
  residentId: string;
  startAt: Date;
  endAt: Date;
  status: string;
};

export type ComunicadoPayload = {
  announcementId: string;
  title: string;
  summary: string;
  critical: boolean;
  audience: string;
  towerId?: string | null;
};

export type PagoPayload = {
  paymentId: string;
  reference: string;
  ledgerAccountId: string;
  apartmentId: string;
  residentIds: string[];
  amount: number;
  status: string;
};

export type PasswordResetPayload = {
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
};

export type AnyDomainEvent =
  | DomainEvent<VisitaPayload>
  | DomainEvent<PqrsPayload>
  | DomainEvent<ReservaPayload>
  | DomainEvent<ComunicadoPayload>
  | DomainEvent<PagoPayload>
  | DomainEvent<PasswordResetPayload>;

export function buildEvent<T>(name: DomainEventName, payload: T, actorId?: string | null): DomainEvent<T> {
  return { name, occurredAt: new Date(), actorId, payload };
}
