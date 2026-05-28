import { Role, VisitStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function listVisits(role: Role, userId: string, apartmentId?: string | null) {
  const result = await listVisitsPage(role, userId, apartmentId);
  return result.rows;
}

export async function listVisitsPage(role: Role, userId: string, apartmentId?: string | null, page = 1, pageSize = 25) {
  const where =
    role === Role.RESIDENT
      ? { residentId: userId }
      : role === Role.GUARD
        ? {
            status: {
              in: [VisitStatus.APPROVED, VisitStatus.CHECKED_IN, VisitStatus.PRE_REGISTERED, VisitStatus.COMPLETED],
            },
          }
        : apartmentId
          ? { apartmentId }
          : undefined;

  const [rows, total] = await Promise.all([
    db.visit.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        code: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        reason: true,
        qrToken: true,
        visitor: {
          select: {
            fullName: true,
            document: true,
          },
        },
        resident: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        apartment: {
          select: {
            number: true,
            tower: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { scheduledStart: "desc" },
    }),
    db.visit.count({ where }),
  ]);

  return {
    rows,
    total,
    totalPages: Math.ceil(total / pageSize),
    page,
    pageSize,
  };
}

export async function getGateQueue() {
  return db.visit.findMany({
    where: {
      status: { in: [VisitStatus.APPROVED, VisitStatus.CHECKED_IN] },
    },
    include: {
      visitor: true,
      apartment: { include: { tower: true } },
      resident: true,
    },
    orderBy: { scheduledStart: "asc" },
  });
}

export async function searchVisitForGate(term: string) {
  return db.visit.findFirst({
    where: {
      OR: [
        { code: term },
        { qrToken: term },
        { visitor: { document: term } },
      ],
    },
    include: {
      visitor: true,
      apartment: { include: { tower: true } },
      resident: true,
      guardIn: true,
      guardOut: true,
    },
  });
}
