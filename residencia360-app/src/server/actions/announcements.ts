"use server";

import { AnnouncementAudience } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";
import { fromDomainError, type ActionResult } from "@/server/domain/errors/domain-errors";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";

const schema = z.object({
  title: z.string().min(4),
  summary: z.string().min(8),
  content: z.string().min(20),
  audience: z.nativeEnum(AnnouncementAudience),
  towerId: z.string().optional(),
  critical: z.boolean().default(false),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
      }),
    )
    .optional(),
});

export async function createAnnouncementAction(
  input: z.infer<typeof schema>,
  actorId: string,
): Promise<ActionResult<{ announcementId: string }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos del anuncio invalidos." };
  }

  try {
    const attachments = parsed.data.attachments ?? [];
    const announcement = await db.announcement.create({
      data: {
        title: parsed.data.title,
        summary: parsed.data.summary,
        content: parsed.data.content,
        audience: parsed.data.audience,
        critical: parsed.data.critical,
        towerId:
          parsed.data.audience === AnnouncementAudience.TOWER ? parsed.data.towerId : undefined,
        createdById: actorId,
        attachments: attachments.length
          ? { createMany: { data: attachments } }
          : undefined,
      },
    });

    await writeAuditLog({
      actorId,
      action: "ANNOUNCEMENT_CREATED",
      entityType: "Announcement",
      entityId: announcement.id,
      detail: `Anuncio ${announcement.title} publicado.`,
    });

    await eventBus.publish(
      buildEvent(
        "ComunicadoPublicado",
        {
          announcementId: announcement.id,
          title: announcement.title,
          summary: announcement.summary,
          critical: announcement.critical,
          audience: announcement.audience,
          towerId: announcement.towerId,
        },
        actorId,
      ),
    );

    revalidatePath("/announcements");
    return {
      success: true,
      message: "Anuncio publicado.",
      data: { announcementId: announcement.id },
    };
  } catch (err) {
    return fromDomainError(err, "No se pudo publicar el anuncio.");
  }
}
