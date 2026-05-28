"use server";

import { PqrsPriority, PqrsStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";
import { fromDomainError, type ActionResult } from "@/server/domain/errors/domain-errors";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";
import { PqrsStateMachine } from "@/server/domain/entities/pqrs";
import { calcularVencimientoSLA, obtenerPoliticaSLA } from "@/server/domain/policies/sla-policy";

const pqrsSchema = z.object({
  category: z.string().min(3),
  subject: z.string().min(6),
  description: z.string().min(20),
  priority: z.nativeEnum(PqrsPriority),
  apartmentId: z.string().min(1),
  attachmentName: z.string().trim().optional(),
  attachmentUrl: z.string().url().optional(),
});

export async function createPqrsAction(
  input: z.infer<typeof pqrsSchema>,
  residentId: string,
): Promise<ActionResult<{ ticketNumber: string }>> {
  const parsed = pqrsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de PQRS invalidos." };
  }

  try {
    const count = await db.pqrs.count();
    const ticketNumber = `PQRS-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    const politica = obtenerPoliticaSLA(parsed.data.priority);
    const slaDueAt = politica.calcularVencimiento(new Date());

    const fileUrl = parsed.data.attachmentUrl ?? (parsed.data.attachmentName
      ? `/uploads/mock/${parsed.data.attachmentName}`
      : undefined);

    const pqrs = await db.pqrs.create({
      data: {
        category: parsed.data.category,
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
        apartmentId: parsed.data.apartmentId,
        residentId,
        ticketNumber,
        status: PqrsStatus.FILED,
        slaDueAt,
        attachments: parsed.data.attachmentName
          ? {
              create: {
                fileName: parsed.data.attachmentName,
                fileUrl: fileUrl!,
              },
            }
          : undefined,
      },
    });

    await writeAuditLog({
      actorId: residentId,
      action: "PQRS_CREATED",
      entityType: "Pqrs",
      entityId: pqrs.id,
      detail: `PQRS ${ticketNumber} creada con SLA ${politica.descripcion()}.`,
    });

    await eventBus.publish(
      buildEvent(
        "PqrsRadicada",
        {
          pqrsId: pqrs.id,
          ticketNumber: pqrs.ticketNumber,
          residentId,
          assignedToId: null,
          priority: pqrs.priority,
          status: pqrs.status,
          slaDueAt: pqrs.slaDueAt,
          subject: pqrs.subject,
        },
        residentId,
      ),
    );

    revalidatePath("/pqrs");
    return { success: true, message: "PQRS radicada.", data: { ticketNumber } };
  } catch (err) {
    return fromDomainError(err, "No se pudo radicar la PQRS.");
  }
}

export async function addPqrsCommentAction(
  pqrsId: string,
  authorId: string,
  message: string,
  internal = false,
  evidenceUrl?: string,
): Promise<ActionResult> {
  if (!message.trim()) {
    return { success: false, message: "El comentario es obligatorio." };
  }

  await db.pqrsComment.create({
    data: {
      pqrsId,
      authorId,
      message,
      internal,
      evidenceUrl,
    },
  });

  await writeAuditLog({
    actorId: authorId,
    action: "PQRS_COMMENT_ADDED",
    entityType: "Pqrs",
    entityId: pqrsId,
    detail: "Se agrego comentario al ticket.",
  });

  revalidatePath("/pqrs");
  return { success: true, message: "Comentario agregado." };
}

export async function assignPqrsAction(
  pqrsId: string,
  assigneeId: string,
  actorId: string,
): Promise<ActionResult> {
  try {
    const current = await db.pqrs.findUnique({ where: { id: pqrsId } });
    if (!current) return { success: false, message: "PQRS no encontrada." };

    const transicion = PqrsStateMachine.transitar(
      { status: current.status },
      PqrsStatus.IN_PROGRESS,
      { assigneeId },
    );

    const updated = await db.pqrs.update({
      where: { id: pqrsId },
      data: { status: transicion.nuevoEstado, assignedToId: assigneeId },
    });

    await writeAuditLog({
      actorId,
      action: "PQRS_ASSIGNED",
      entityType: "Pqrs",
      entityId: pqrsId,
      detail: `PQRS asignada a ${assigneeId}.`,
    });

    await eventBus.publish(
      buildEvent(
        "PqrsAsignada",
        {
          pqrsId: updated.id,
          ticketNumber: updated.ticketNumber,
          residentId: updated.residentId,
          assignedToId: assigneeId,
          priority: updated.priority,
          status: updated.status,
          slaDueAt: updated.slaDueAt,
          subject: updated.subject,
        },
        actorId,
      ),
    );

    revalidatePath("/pqrs");
    return { success: true, message: "PQRS asignada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo asignar la PQRS.");
  }
}

export async function updatePqrsStatusAction(
  pqrsId: string,
  targetStatus: PqrsStatus,
  actorId: string,
  finalResponse?: string,
  evidenceFileName?: string,
  evidenceUrl?: string,
): Promise<ActionResult> {
  try {
    const message = finalResponse?.trim();
    const attachmentName = evidenceFileName?.trim();
    const hasFinalResponse = Boolean(message);
    const hasEvidence = Boolean(attachmentName || evidenceUrl);

    const current = await db.pqrs.findUnique({
      where: { id: pqrsId },
      include: { comments: true, attachments: true },
    });
    if (!current) return { success: false, message: "PQRS no encontrada." };

    const accumulatedHasEvidence =
      hasEvidence || current.attachments.length > 0 || current.comments.some((c) => c.evidenceUrl);

    const transicion = PqrsStateMachine.transitar(
      {
        status: current.status,
        hasFinalResponse: hasFinalResponse || current.comments.some((c) => !c.internal),
        hasEvidence: accumulatedHasEvidence,
      },
      targetStatus,
    );

    if (message || attachmentName || evidenceUrl) {
      await db.pqrsComment.create({
        data: {
          pqrsId,
          authorId: actorId,
          message: message ?? "Se adjunta evidencia de gestion.",
          internal: false,
          evidenceUrl: evidenceUrl ?? (attachmentName ? `/uploads/mock/${attachmentName}` : undefined),
        },
      });
    }

    const updated = await db.pqrs.update({
      where: { id: pqrsId },
      data: {
        status: transicion.nuevoEstado,
        closedAt: transicion.campos?.closedAt ?? (transicion.nuevoEstado === PqrsStatus.CLOSED ? new Date() : null),
        attachments: attachmentName
          ? {
              create: {
                fileName: attachmentName,
                fileUrl: evidenceUrl ?? `/uploads/mock/${attachmentName}`,
              },
            }
          : undefined,
      },
    });

    await writeAuditLog({
      actorId,
      action: "PQRS_STATUS_UPDATED",
      entityType: "Pqrs",
      entityId: pqrsId,
      detail: `PQRS actualizada a ${updated.status}.`,
    });

    const payload = {
      pqrsId: updated.id,
      ticketNumber: updated.ticketNumber,
      residentId: updated.residentId,
      assignedToId: updated.assignedToId,
      priority: updated.priority,
      status: updated.status,
      slaDueAt: updated.slaDueAt,
      subject: updated.subject,
    };

    const eventByStatus: Record<PqrsStatus, "PqrsRadicada" | "PqrsAsignada" | "PqrsResuelta" | "PqrsCerrada" | "PqrsReabierta"> = {
      FILED: "PqrsRadicada",
      IN_PROGRESS: current.status === PqrsStatus.RESOLVED || current.status === PqrsStatus.CLOSED ? "PqrsReabierta" : "PqrsAsignada",
      THIRD_PARTY_PENDING: "PqrsAsignada",
      RESOLVED: "PqrsResuelta",
      CLOSED: "PqrsCerrada",
    };

    await eventBus.publish(buildEvent(eventByStatus[updated.status], payload, actorId));

    revalidatePath("/pqrs");
    return { success: true, message: "Estado actualizado." };
  } catch (err) {
    return fromDomainError(err, "No se pudo actualizar la PQRS.");
  }
}

export async function calcularVencimientoPorPrioridadAction(
  priority: PqrsPriority,
): Promise<{ vencimiento: string; descripcion: string }> {
  const politica = obtenerPoliticaSLA(priority);
  return {
    vencimiento: calcularVencimientoSLA(priority).toISOString(),
    descripcion: politica.descripcion(),
  };
}
