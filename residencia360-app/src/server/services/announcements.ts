import { Role } from "@prisma/client";

import { db } from "@/lib/db";

export async function listAnnouncements(role: Role, towerId?: string | null) {
  return db.announcement.findMany({
    where:
      role === Role.RESIDENT && towerId
        ? {
            OR: [{ audience: "WHOLE_COMMUNITY" }, { audience: "TOWER", towerId }],
          }
        : undefined,
    select: {
      id: true,
      title: true,
      summary: true,
      content: true,
      critical: true,
      publishAt: true,
      tower: {
        select: {
          name: true,
        },
      },
      createdBy: {
        select: {
          firstName: true,
        },
      },
    },
    orderBy: [{ critical: "desc" }, { publishAt: "desc" }],
  });
}

export async function markAnnouncementRead(announcementId: string, userId: string) {
  await db.announcementRead.upsert({
    where: {
      announcementId_userId: { announcementId, userId },
    },
    create: { announcementId, userId },
    update: { readAt: new Date() },
  });
}
