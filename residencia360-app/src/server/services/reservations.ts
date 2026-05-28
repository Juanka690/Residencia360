import { Role } from "@prisma/client";

import { db } from "@/lib/db";

export async function listReservations(role: Role, userId: string) {
  return db.reservation.findMany({
    where:
      role === Role.RESIDENT
        ? {
            residentId: userId,
          }
        : undefined,
    include: {
      area: true,
      resident: true,
      apartment: { include: { tower: true } },
      approvedBy: true,
    },
    orderBy: { startAt: "asc" },
  });
}

export async function listReservationBlocks() {
  return db.maintenanceBlock.findMany({
    include: { area: true },
    orderBy: { startAt: "asc" },
  });
}

export async function listCommonAreas() {
  return db.commonArea.findMany({
    orderBy: { name: "asc" },
  });
}
