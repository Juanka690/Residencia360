"use server";

import { AnnouncementAudience } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";

const schema = z.object({
  title: z.string().min(4),
  summary: z.string().min(8),
  content: z.string().min(20),
  audience: z.nativeEnum(AnnouncementAudience),
  towerId: z.string().optional(),
  critical: z.boolean().default(false),
});

export async function createAnnouncementAction(input: z.infer<typeof schema>, actorId: string) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos del anuncio invalidos." };
  }

  const announcement = await db.announcement.create({
    data: {
      ...parsed.data,
      towerId: parsed.data.audience === AnnouncementAudience.TOWER ? parsed.data.towerId : undefined,
      createdById: actorId,
    },
  });

  await writeAuditLog({
    actorId,
    action: "ANNOUNCEMENT_CREATED",
    entityType: "Announcement",
    entityId: announcement.id,
    detail: `Anuncio ${announcement.title} publicado.`,
  });

  revalidatePath("/announcements");
  return { success: true, message: "Anuncio publicado." };
}
