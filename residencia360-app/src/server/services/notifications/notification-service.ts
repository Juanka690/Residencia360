import { db } from "@/lib/db";
import type {
  AnyDomainEvent,
  ComunicadoPayload,
  PagoPayload,
  PasswordResetPayload,
  PqrsPayload,
  ReservaPayload,
  VisitaPayload,
} from "@/server/domain/events/domain-events";
import type { EventObserver } from "@/server/domain/events/event-bus";
import { eventBus } from "@/server/domain/events/event-bus";

import type { DestinoNotificacion, MensajeNotificacion } from "./channels/notification-channel";
import { NotificationFactory, notificationFactory } from "./notification-factory";

type ResolverDestinatarios = (event: AnyDomainEvent) => Promise<DestinoNotificacion[]>;
type ConstruirMensaje = (event: AnyDomainEvent) => MensajeNotificacion;

/**
 * Patron Observer (Entregable 2 §4.2).
 * Se suscribe al EventBus y delega en la NotificationFactory para emitir por canal.
 */
export class NotificationService implements EventObserver {
  readonly id = "notification-service";

  constructor(private readonly factory: NotificationFactory = notificationFactory) {}

  async handle(event: AnyDomainEvent): Promise<void> {
    const builder = builders[event.name];
    const resolver = resolvers[event.name];
    if (!builder || !resolver) return;

    const destinatarios = await resolver(event);
    if (destinatarios.length === 0) return;

    const mensaje = builder(event);

    const inApp = this.factory.crear("IN_APP");
    const email = this.factory.crear("EMAIL");

    await Promise.allSettled(
      destinatarios.flatMap((destino) => [
        inApp.enviar(destino, mensaje),
        destino.email ? email.enviar(destino, mensaje) : Promise.resolve({ delivered: false }),
      ]),
    );
  }
}

// ---------- Resolvers (a quien notificar) ----------

const resolvers: Partial<Record<AnyDomainEvent["name"], ResolverDestinatarios>> = {
  VisitaAprobada: async (event) => {
    const payload = event.payload as VisitaPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  VisitaIngresada: async (event) => {
    const payload = event.payload as VisitaPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  VisitaFinalizada: async (event) => {
    const payload = event.payload as VisitaPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  VisitaRechazada: async (event) => {
    const payload = event.payload as VisitaPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  PqrsRadicada: async (event) => {
    const payload = event.payload as PqrsPayload;
    const admins = await db.user.findMany({
      where: { role: { in: ["ADMIN", "BOARD"] }, status: "ACTIVE" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return admins.map((a) => ({ userId: a.id, email: a.email, fullName: `${a.firstName} ${a.lastName}` }));
  },
  PqrsAsignada: async (event) => {
    const payload = event.payload as PqrsPayload;
    if (!payload.assignedToId) return [];
    return resolverPorUserIds([payload.assignedToId]);
  },
  PqrsResuelta: async (event) => {
    const payload = event.payload as PqrsPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  PqrsCerrada: async (event) => {
    const payload = event.payload as PqrsPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  PqrsReabierta: async (event) => {
    const payload = event.payload as PqrsPayload;
    if (!payload.assignedToId) return [];
    return resolverPorUserIds([payload.assignedToId]);
  },
  PqrsSlaPorVencer: async (event) => {
    const payload = event.payload as PqrsPayload;
    const ids: string[] = [];
    if (payload.assignedToId) ids.push(payload.assignedToId);
    const admins = await db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    ids.push(...admins.map((a) => a.id));
    return resolverPorUserIds(ids);
  },
  ReservaCreada: async (event) => {
    const payload = event.payload as ReservaPayload;
    const admins = await db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return [
      ...(await resolverPorUserIds([payload.residentId])),
      ...admins.map((a) => ({ userId: a.id, email: a.email, fullName: `${a.firstName} ${a.lastName}` })),
    ];
  },
  ReservaAprobada: async (event) => {
    const payload = event.payload as ReservaPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  ReservaRechazada: async (event) => {
    const payload = event.payload as ReservaPayload;
    return resolverPorUserIds([payload.residentId]);
  },
  ComunicadoPublicado: async (event) => {
    const payload = event.payload as ComunicadoPayload;
    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        ...(payload.audience === "TOWER" && payload.towerId
          ? { towerId: payload.towerId }
          : payload.audience === "WHOLE_COMMUNITY"
            ? {}
            : {}),
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return users.map((u) => ({ userId: u.id, email: u.email, fullName: `${u.firstName} ${u.lastName}` }));
  },
  PagoEnviado: async (event) => {
    const payload = event.payload as PagoPayload;
    const admins = await db.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    return admins.map((a) => ({ userId: a.id, email: a.email, fullName: `${a.firstName} ${a.lastName}` }));
  },
  PagoAprobado: async (event) => {
    const payload = event.payload as PagoPayload;
    return resolverPorUserIds(payload.residentIds);
  },
  PagoRechazado: async (event) => {
    const payload = event.payload as PagoPayload;
    return resolverPorUserIds(payload.residentIds);
  },
  PasswordResetSolicitado: async (event) => {
    const payload = event.payload as PasswordResetPayload;
    return [{ userId: payload.userId, email: payload.email }];
  },
};

async function resolverPorUserIds(ids: string[]): Promise<DestinoNotificacion[]> {
  if (ids.length === 0) return [];
  const users = await db.user.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  return users.map((u) => ({ userId: u.id, email: u.email, fullName: `${u.firstName} ${u.lastName}` }));
}

// ---------- Builders (mensaje por evento) ----------

const builders: Partial<Record<AnyDomainEvent["name"], ConstruirMensaje>> = {
  VisitaAprobada: (event) => {
    const payload = event.payload as VisitaPayload;
    return {
      type: "VISITA_APROBADA",
      title: `Visita aprobada: ${payload.visitorName}`,
      body: `Tu visita ${payload.code} para ${payload.visitorName} fue aprobada y queda lista para presentarse en porteria.`,
      link: `/visitors/${payload.visitId}`,
    };
  },
  VisitaIngresada: (event) => {
    const payload = event.payload as VisitaPayload;
    return {
      type: "VISITA_INGRESADA",
      title: `Ingreso registrado: ${payload.visitorName}`,
      body: `Tu visita ${payload.code} acaba de ingresar a la unidad.`,
      link: `/visitors/${payload.visitId}`,
    };
  },
  VisitaFinalizada: (event) => {
    const payload = event.payload as VisitaPayload;
    return {
      type: "VISITA_FINALIZADA",
      title: `Salida registrada: ${payload.visitorName}`,
      body: `Se registro la salida de tu visita ${payload.code}.`,
      link: `/visitors/${payload.visitId}`,
    };
  },
  VisitaRechazada: (event) => {
    const payload = event.payload as VisitaPayload;
    return {
      type: "VISITA_RECHAZADA",
      title: `Visita rechazada: ${payload.visitorName}`,
      body: `La visita ${payload.code} fue rechazada y no podra ingresar.`,
      link: `/visitors/${payload.visitId}`,
    };
  },
  PqrsRadicada: (event) => {
    const payload = event.payload as PqrsPayload;
    return {
      type: "PQRS_RADICADA",
      title: `Nueva PQRS ${payload.ticketNumber}`,
      body: `Se radico una nueva PQRS (${payload.priority}): ${payload.subject}. SLA: ${payload.slaDueAt.toLocaleString()}.`,
      link: `/pqrs`,
    };
  },
  PqrsAsignada: (event) => {
    const payload = event.payload as PqrsPayload;
    return {
      type: "PQRS_ASIGNADA",
      title: `Se te asigno la PQRS ${payload.ticketNumber}`,
      body: `Asunto: ${payload.subject}. SLA: ${payload.slaDueAt.toLocaleString()}.`,
      link: `/pqrs`,
    };
  },
  PqrsResuelta: (event) => {
    const payload = event.payload as PqrsPayload;
    return {
      type: "PQRS_RESUELTA",
      title: `PQRS ${payload.ticketNumber} resuelta`,
      body: `Tu PQRS fue marcada como resuelta. Confirma el cierre o solicita reapertura.`,
      link: `/pqrs`,
    };
  },
  PqrsCerrada: (event) => {
    const payload = event.payload as PqrsPayload;
    return {
      type: "PQRS_CERRADA",
      title: `PQRS ${payload.ticketNumber} cerrada`,
      body: `Tu PQRS ha sido cerrada.`,
      link: `/pqrs`,
    };
  },
  PqrsReabierta: (event) => {
    const payload = event.payload as PqrsPayload;
    return {
      type: "PQRS_REABIERTA",
      title: `PQRS ${payload.ticketNumber} reabierta`,
      body: `La PQRS fue reabierta y vuelve a estar en proceso.`,
      link: `/pqrs`,
    };
  },
  PqrsSlaPorVencer: (event) => {
    const payload = event.payload as PqrsPayload;
    return {
      type: "PQRS_SLA_POR_VENCER",
      title: `SLA proximo a vencer: ${payload.ticketNumber}`,
      body: `Atencion: el SLA de la PQRS ${payload.ticketNumber} esta por vencer (${payload.slaDueAt.toLocaleString()}).`,
      link: `/pqrs`,
    };
  },
  ReservaCreada: (event) => {
    const payload = event.payload as ReservaPayload;
    return {
      type: "RESERVA_CREADA",
      title: `Nueva reserva: ${payload.areaName}`,
      body: `Se creo una reserva para ${payload.areaName} entre ${payload.startAt.toLocaleString()} y ${payload.endAt.toLocaleString()}.`,
      link: `/reservations`,
    };
  },
  ReservaAprobada: (event) => {
    const payload = event.payload as ReservaPayload;
    return {
      type: "RESERVA_APROBADA",
      title: `Reserva aprobada: ${payload.areaName}`,
      body: `Tu reserva fue aprobada.`,
      link: `/reservations`,
    };
  },
  ReservaRechazada: (event) => {
    const payload = event.payload as ReservaPayload;
    return {
      type: "RESERVA_RECHAZADA",
      title: `Reserva rechazada: ${payload.areaName}`,
      body: `Tu reserva fue rechazada.`,
      link: `/reservations`,
    };
  },
  ComunicadoPublicado: (event) => {
    const payload = event.payload as ComunicadoPayload;
    return {
      type: payload.critical ? "COMUNICADO_CRITICO" : "COMUNICADO",
      title: payload.critical ? `URGENTE: ${payload.title}` : payload.title,
      body: payload.summary,
      link: `/announcements`,
    };
  },
  PagoEnviado: (event) => {
    const payload = event.payload as PagoPayload;
    return {
      type: "PAGO_ENVIADO",
      title: `Soporte de pago recibido: ${payload.reference}`,
      body: `Hay un soporte de pago pendiente de revision.`,
      link: `/accounting`,
    };
  },
  PagoAprobado: (event) => {
    const payload = event.payload as PagoPayload;
    return {
      type: "PAGO_APROBADO",
      title: `Pago aprobado: ${payload.reference}`,
      body: `Tu pago fue aplicado al estado de cuenta.`,
      link: `/accounting`,
    };
  },
  PagoRechazado: (event) => {
    const payload = event.payload as PagoPayload;
    return {
      type: "PAGO_RECHAZADO",
      title: `Pago rechazado: ${payload.reference}`,
      body: `Tu soporte de pago fue rechazado. Revisa la retroalimentacion y vuelve a enviarlo.`,
      link: `/accounting`,
    };
  },
  PasswordResetSolicitado: (event) => {
    const payload = event.payload as PasswordResetPayload;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const link = `${baseUrl}/auth/reset-password/${payload.token}`;
    return {
      type: "PASSWORD_RESET",
      title: "Recuperacion de contrasena Residencia360",
      body: `Recibimos una solicitud para restablecer tu contrasena. Usa el enlace para crear una nueva (vence el ${payload.expiresAt.toLocaleString()}).`,
      link,
    };
  },
};

let suscrito = false;
export function registrarNotificationObserver(): void {
  if (suscrito) return;
  eventBus.subscribe(new NotificationService());
  suscrito = true;
}

// Auto-registro: la primera vez que se importa el modulo en el server, queda suscrito.
registrarNotificationObserver();
