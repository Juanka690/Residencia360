"use server";

import { PqrsPriority, PqrsStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";

const pqrsSchema = z.object({
  category: z.string().min(3),
  subject: z.string().min(6),
  description: z.string().min(20),
  priority: z.nativeEnum(PqrsPriority),
  apartmentId: z.string().min(1),
  attachmentName: z.string().trim().optional(),
});

export async function createPqrsAction(input: z.infer<typeof pqrsSchema>, residentId: string) {
  const parsed = pqrsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de PQRS invalidos." };
  }

  const count = await db.pqrs.count();
  const ticketNumber = `PQRS-2026-${String(count + 1).padStart(4, "0")}`;
  const slaByPriority = {
    LOW: 5,
    MEDIUM: 3,
    HIGH: 2,
    CRITICAL: 1,
  } as const;

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
      slaDueAt: new Date(Date.now() + slaByPriority[parsed.data.priority] * 24 * 60 * 60 * 1000),
      attachments: parsed.data.attachmentName
        ? {
            create: {
              fileName: parsed.data.attachmentName,
              fileUrl: `/uploads/mock/${parsed.data.attachmentName}`,
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
    detail: `PQRS ${ticketNumber} creada.`,
  });

  revalidatePath("/pqrs");
  return { success: true, message: "PQRS radicada.", ticketNumber };
}

export async function addPqrsCommentAction(pqrsId: string, authorId: string, message: string, internal = false) {
  if (!message.trim()) {
    return { success: false, message: "El comentario es obligatorio." };
  }

  await db.pqrsComment.create({
    data: {
      pqrsId,
      authorId,
      message,
      internal,
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

export async function updatePqrsStatusAction(
  pqrsId: string,
  status: PqrsStatus,
  actorId: string,
  finalResponse?: string,
  evidenceFileName?: string,
) {
  const message = finalResponse?.trim();
  const attachmentName = evidenceFileName?.trim();
  const requiresResponse = status === PqrsStatus.RESOLVED || status === PqrsStatus.CLOSED;

  if (requiresResponse && !message) {
    return { success: false, message: "Debes registrar una respuesta final antes de resolver o cerrar la PQRS." };
  }

  if (message || attachmentName) {
    await db.pqrsComment.create({
      data: {
        pqrsId,
        authorId: actorId,
        message: message ?? "Se adjunta evidencia de gestion.",
        internal: false,
        evidenceUrl: attachmentName ? `/uploads/mock/${attachmentName}` : undefined,
      },
    });
  }

  await db.pqrs.update({
    where: { id: pqrsId },
    data: {
      status,
      closedAt: status === PqrsStatus.CLOSED ? new Date() : null,
      attachments: attachmentName
        ? {
            create: {
              fileName: attachmentName,
              fileUrl: `/uploads/mock/${attachmentName}`,
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
    detail: `PQRS actualizada a ${status}.`,
  });

  revalidatePath("/pqrs");
  return { success: true, message: "Estado actualizado." };
}
