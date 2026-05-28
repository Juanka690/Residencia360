"use server";

import { VisitStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";
import { VisitStateMachine } from "@/server/domain/entities/visit";
import { fromDomainError, type ActionResult } from "@/server/domain/errors/domain-errors";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";

const visitSchema = z.object({
  fullName: z.string().min(3),
  document: z.string().min(5),
  phone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  reason: z.string().min(4),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  gateType: z.enum(["PEDESTRIAN", "VEHICULAR"]),
  apartmentId: z.string().min(1),
  residentId: z.string().min(1),
});

export async function createVisitAction(
  input: z.infer<typeof visitSchema>,
  actorId: string,
): Promise<ActionResult<{ visitId: string; code: string }>> {
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de visita invalidos." };
  }

  const start = new Date(parsed.data.scheduledStart);
  const end = new Date(parsed.data.scheduledEnd);

  if (end <= start) {
    return { success: false, message: "La salida debe ser posterior al ingreso." };
  }

  try {
    const visitor = await db.visitor.upsert({
      where: {
        document_fullName: {
          document: parsed.data.document,
          fullName: parsed.data.fullName,
        },
      },
      create: {
        fullName: parsed.data.fullName,
        document: parsed.data.document,
        phone: parsed.data.phone,
        vehiclePlate: parsed.data.vehiclePlate,
      },
      update: {
        phone: parsed.data.phone,
        vehiclePlate: parsed.data.vehiclePlate,
      },
    });

    const count = await db.visit.count();
    const code = `VIS-${String(count + 1).padStart(4, "0")}`;
    const qrToken = `QR-${code}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const visit = await db.visit.create({
      data: {
        code,
        qrToken,
        visitorId: visitor.id,
        residentId: parsed.data.residentId,
        apartmentId: parsed.data.apartmentId,
        createdById: actorId,
        reason: parsed.data.reason,
        scheduledStart: start,
        scheduledEnd: end,
        gateType: parsed.data.gateType,
        status: VisitStatus.PRE_REGISTERED,
      },
      include: {
        visitor: true,
        apartment: true,
      },
    });

    await writeAuditLog({
      actorId,
      action: "VISIT_CREATED",
      entityType: "Visit",
      entityId: visit.id,
      detail: `Visita ${code} creada para ${visitor.fullName}.`,
    });

    await eventBus.publish(
      buildEvent(
        "VisitaPreRegistrada",
        {
          visitId: visit.id,
          code: visit.code,
          residentId: visit.residentId,
          apartmentLabel: visit.apartment.apartmentCode,
          visitorName: visitor.fullName,
          status: visit.status,
          scheduledStart: visit.scheduledStart,
          scheduledEnd: visit.scheduledEnd,
        },
        actorId,
      ),
    );

    revalidatePath("/visitors");
    revalidatePath("/dashboard/resident");
    return { success: true, message: "Visita pre-registrada.", data: { visitId: visit.id, code } };
  } catch (err) {
    return fromDomainError(err, "No se pudo crear la visita.");
  }
}

export async function approveVisitAction(visitId: string, actorId: string): Promise<ActionResult> {
  try {
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: { visitor: true, apartment: true },
    });
    if (!visit) return { success: false, message: "Visita no encontrada." };

    const transicion = VisitStateMachine.aprobar(
      {
        status: visit.status,
        scheduledStart: visit.scheduledStart,
        scheduledEnd: visit.scheduledEnd,
        qrToken: visit.qrToken,
      },
      actorId,
    );

    await db.visit.update({
      where: { id: visitId },
      data: { status: transicion.nuevoEstado, ...transicion.campos },
    });

    await writeAuditLog({
      actorId,
      action: "VISIT_APPROVED",
      entityType: "Visit",
      entityId: visitId,
      detail: `Visita ${visit.code} aprobada.`,
    });

    await eventBus.publish(
      buildEvent(
        "VisitaAprobada",
        {
          visitId: visit.id,
          code: visit.code,
          residentId: visit.residentId,
          apartmentLabel: visit.apartment.apartmentCode,
          visitorName: visit.visitor.fullName,
          status: transicion.nuevoEstado,
          scheduledStart: visit.scheduledStart,
          scheduledEnd: visit.scheduledEnd,
        },
        actorId,
      ),
    );

    revalidatePath("/visitors");
    revalidatePath("/gate");
    return { success: true, message: "Visita aprobada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo aprobar la visita.");
  }
}

export async function rejectVisitAction(visitId: string, actorId: string): Promise<ActionResult> {
  try {
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: { visitor: true, apartment: true },
    });
    if (!visit) return { success: false, message: "Visita no encontrada." };

    const transicion = VisitStateMachine.rechazar({
      status: visit.status,
      scheduledStart: visit.scheduledStart,
      scheduledEnd: visit.scheduledEnd,
      qrToken: visit.qrToken,
    });

    await db.visit.update({ where: { id: visitId }, data: { status: transicion.nuevoEstado } });

    await writeAuditLog({
      actorId,
      action: "VISIT_REJECTED",
      entityType: "Visit",
      entityId: visitId,
      detail: `Visita ${visit.code} rechazada.`,
    });

    await eventBus.publish(
      buildEvent(
        "VisitaRechazada",
        {
          visitId: visit.id,
          code: visit.code,
          residentId: visit.residentId,
          apartmentLabel: visit.apartment.apartmentCode,
          visitorName: visit.visitor.fullName,
          status: transicion.nuevoEstado,
          scheduledStart: visit.scheduledStart,
          scheduledEnd: visit.scheduledEnd,
        },
        actorId,
      ),
    );

    revalidatePath("/visitors");
    revalidatePath("/gate");
    return { success: true, message: "Visita rechazada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo rechazar la visita.");
  }
}

export async function cancelVisitAction(visitId: string, actorId: string): Promise<ActionResult> {
  try {
    const visit = await db.visit.findUnique({ where: { id: visitId } });
    if (!visit) return { success: false, message: "Visita no encontrada." };

    const transicion = VisitStateMachine.cancelar({
      status: visit.status,
      scheduledStart: visit.scheduledStart,
      scheduledEnd: visit.scheduledEnd,
      qrToken: visit.qrToken,
    });

    await db.visit.update({ where: { id: visitId }, data: { status: transicion.nuevoEstado } });

    await writeAuditLog({
      actorId,
      action: "VISIT_CANCELLED",
      entityType: "Visit",
      entityId: visitId,
      detail: `Visita ${visit.code} cancelada.`,
    });

    revalidatePath("/visitors");
    revalidatePath("/gate");
    return { success: true, message: "Visita cancelada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo cancelar la visita.");
  }
}

export async function registerVisitIngressAction(
  visitId: string,
  guardId: string,
): Promise<ActionResult> {
  try {
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: { visitor: true, apartment: true },
    });
    if (!visit) return { success: false, message: "Visita no encontrada." };

    const transicion = VisitStateMachine.validarIngreso(
      {
        status: visit.status,
        scheduledStart: visit.scheduledStart,
        scheduledEnd: visit.scheduledEnd,
        qrToken: visit.qrToken,
      },
      guardId,
    );

    await db.visit.update({
      where: { id: visitId },
      data: { status: transicion.nuevoEstado, ...transicion.campos },
    });

    await writeAuditLog({
      actorId: guardId,
      action: "VISIT_CHECKED_IN",
      entityType: "Visit",
      entityId: visitId,
      detail: `Ingreso registrado para ${visit.code}.`,
    });

    await eventBus.publish(
      buildEvent(
        "VisitaIngresada",
        {
          visitId: visit.id,
          code: visit.code,
          residentId: visit.residentId,
          apartmentLabel: visit.apartment.apartmentCode,
          visitorName: visit.visitor.fullName,
          status: transicion.nuevoEstado,
          scheduledStart: visit.scheduledStart,
          scheduledEnd: visit.scheduledEnd,
        },
        guardId,
      ),
    );

    revalidatePath("/gate");
    revalidatePath("/visitors");
    return { success: true, message: "Ingreso registrado." };
  } catch (err) {
    // Si fue ingreso denegado por ventana, registramos un log denegado para auditoria.
    if (err instanceof Error && err.message.includes("ventana")) {
      await writeAuditLog({
        actorId: guardId,
        action: "VISIT_DENIED_WINDOW",
        entityType: "Visit",
        entityId: visitId,
        detail: `Ingreso denegado por ventana (RN-03).`,
      });
    }
    return fromDomainError(err, "No se pudo registrar el ingreso.");
  }
}

export async function registerVisitEgressAction(
  visitId: string,
  guardId: string,
): Promise<ActionResult> {
  try {
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: { visitor: true, apartment: true },
    });
    if (!visit) return { success: false, message: "Visita no encontrada." };

    const transicion = VisitStateMachine.registrarSalida(
      {
        status: visit.status,
        scheduledStart: visit.scheduledStart,
        scheduledEnd: visit.scheduledEnd,
        qrToken: visit.qrToken,
      },
      guardId,
    );

    await db.visit.update({
      where: { id: visitId },
      data: { status: transicion.nuevoEstado, ...transicion.campos },
    });

    await writeAuditLog({
      actorId: guardId,
      action: "VISIT_CHECKED_OUT",
      entityType: "Visit",
      entityId: visitId,
      detail: `Salida registrada para ${visit.code}.`,
    });

    await eventBus.publish(
      buildEvent(
        "VisitaFinalizada",
        {
          visitId: visit.id,
          code: visit.code,
          residentId: visit.residentId,
          apartmentLabel: visit.apartment.apartmentCode,
          visitorName: visit.visitor.fullName,
          status: transicion.nuevoEstado,
          scheduledStart: visit.scheduledStart,
          scheduledEnd: visit.scheduledEnd,
        },
        guardId,
      ),
    );

    revalidatePath("/gate");
    revalidatePath("/visitors");
    return { success: true, message: "Salida registrada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo registrar la salida.");
  }
}

/**
 * Compat: el old code en /visitors y /gate todavia llama updateVisitStatusAction.
 * Mantenemos la firma pero delegamos a las acciones tipadas.
 */
export async function updateVisitStatusAction(
  visitId: string,
  status: VisitStatus,
  actorId: string,
): Promise<ActionResult> {
  switch (status) {
    case VisitStatus.APPROVED:
      return approveVisitAction(visitId, actorId);
    case VisitStatus.REJECTED:
      return rejectVisitAction(visitId, actorId);
    case VisitStatus.CANCELLED:
      return cancelVisitAction(visitId, actorId);
    case VisitStatus.CHECKED_IN:
      return registerVisitIngressAction(visitId, actorId);
    case VisitStatus.COMPLETED:
      return registerVisitEgressAction(visitId, actorId);
    default:
      return { success: false, message: `Estado no soportado: ${status}` };
  }
}
