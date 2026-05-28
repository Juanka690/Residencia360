import { ReservationStatus } from "@prisma/client";

import { db } from "@/lib/db";
import type { IReservationRepo } from "@/server/repositories/interfaces/reservation-repo";

export class ReservationRepoPrisma implements IReservationRepo {
  findArea(areaId: string) {
    return db.commonArea.findUnique({ where: { id: areaId } });
  }
  findAccount(apartmentId: string) {
    return db.ledgerAccount.findUnique({ where: { apartmentId } });
  }
  findOverlaps(areaId: string, startAt: Date, endAt: Date) {
    return db.reservation.findMany({
      where: {
        areaId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true, status: true },
    });
  }
  findMaintenanceOverlaps(areaId: string, startAt: Date, endAt: Date) {
    return db.maintenanceBlock.findMany({
      where: { areaId, startAt: { lt: endAt }, endAt: { gt: startAt } },
      select: { id: true, startAt: true, endAt: true, reason: true },
    });
  }
  countWeekly(apartmentId: string, since: Date): Promise<number> {
    return db.reservation.count({
      where: {
        apartmentId,
        status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED] },
        startAt: { gte: since },
      },
    });
  }
}

export const reservationRepo = new ReservationRepoPrisma();
