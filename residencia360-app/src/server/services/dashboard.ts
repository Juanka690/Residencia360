import { Role } from "@prisma/client";

import { db } from "@/lib/db";

export async function getDashboardMetrics(role: Role, userId: string, apartmentId?: string | null) {
  switch (role) {
    case Role.RESIDENT: {
      const [upcomingVisits, activePqrs, pendingReservations, account] = await Promise.all([
        db.visit.count({
          where: {
            residentId: userId,
            status: { in: ["PRE_REGISTERED", "APPROVED", "CHECKED_IN"] },
          },
        }),
        db.pqrs.count({
          where: {
            residentId: userId,
            status: { in: ["FILED", "IN_PROGRESS", "THIRD_PARTY_PENDING"] },
          },
        }),
        db.reservation.count({
          where: {
            residentId: userId,
            status: { in: ["PENDING", "APPROVED"] },
          },
        }),
        apartmentId ? db.ledgerAccount.findUnique({ where: { apartmentId } }) : null,
      ]);

      return {
        upcomingVisits,
        activePqrs,
        pendingReservations,
        accountBalance: account?.balance ?? 0,
      };
    }
    case Role.GUARD: {
      const [pendingEntries, checkedInVisitors, providerEntries, occupiedSpots] = await Promise.all([
        db.visit.count({
          where: {
            status: "APPROVED",
            scheduledStart: { lte: new Date() },
            scheduledEnd: { gte: new Date() },
          },
        }),
        db.visit.count({ where: { status: "CHECKED_IN" } }),
        db.providerAccess.count({ where: { status: { in: ["APPROVED", "CHECKED_IN"] } } }),
        db.visitorParkingAssignment.count({
          where: {
            startAt: { lte: new Date() },
            endAt: { gte: new Date() },
          },
        }),
      ]);

      return {
        pendingEntries,
        checkedInVisitors,
        providerEntries,
        occupiedSpots,
      };
    }
    case Role.ADMIN:
    case Role.BOARD: {
      const [visitsToday, openPqrs, pendingReservations, totalOverdue] = await Promise.all([
        db.visit.count({
          where: {
            scheduledStart: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        db.pqrs.count({
          where: {
            status: { in: ["FILED", "IN_PROGRESS", "THIRD_PARTY_PENDING"] },
          },
        }),
        db.reservation.count({ where: { status: "PENDING" } }),
        db.ledgerAccount.aggregate({
          _sum: { overdueAmount: true },
        }),
      ]);

      return {
        visitsToday,
        openPqrs,
        pendingReservations,
        overdueAmount: totalOverdue._sum.overdueAmount ?? 0,
      };
    }
    default:
      return {};
  }
}

export async function getRecentActivity() {
  return db.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      detail: true,
    },
  });
}
