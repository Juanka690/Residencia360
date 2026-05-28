import { db } from "@/lib/db";

type ReportFilters = {
  startDate?: string;
  endDate?: string;
  towerId?: string;
  visitStatus?: string;
};

function buildDateRange(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) {
    return undefined;
  }

  return {
    ...(startDate ? { gte: new Date(`${startDate}T00:00:00`) } : {}),
    ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999`) } : {}),
  };
}

function buildVisitWhere(filters: ReportFilters) {
  const scheduledStart = buildDateRange(filters.startDate, filters.endDate);

  return {
    ...(filters.visitStatus ? { status: filters.visitStatus as never } : {}),
    ...(scheduledStart ? { scheduledStart } : {}),
    ...(filters.towerId
      ? {
          apartment: {
            towerId: filters.towerId,
          },
        }
      : {}),
  };
}

function buildPqrsWhere(filters: ReportFilters) {
  const createdAt = buildDateRange(filters.startDate, filters.endDate);

  return {
    ...(createdAt ? { createdAt } : {}),
    ...(filters.towerId
      ? {
          apartment: {
            towerId: filters.towerId,
          },
        }
      : {}),
  };
}

function buildReservationWhere(filters: ReportFilters) {
  const startAt = buildDateRange(filters.startDate, filters.endDate);

  return {
    ...(startAt ? { startAt } : {}),
    ...(filters.towerId
      ? {
          apartment: {
            towerId: filters.towerId,
          },
        }
      : {}),
  };
}

export async function getBasicReportSummary(filters: ReportFilters = {}) {
  const [visits, pqrs, reservations, overdueAccounts] = await Promise.all([
    db.visit.groupBy({ by: ["status"], _count: true, where: buildVisitWhere(filters) }),
    db.pqrs.groupBy({ by: ["status"], _count: true, where: buildPqrsWhere(filters) }),
    db.reservation.groupBy({ by: ["status"], _count: true, where: buildReservationWhere(filters) }),
    db.ledgerAccount.count({
      where: {
        status: "IN_ARREARS",
        ...(filters.towerId
          ? {
              apartment: {
                towerId: filters.towerId,
              },
            }
          : {}),
      },
    }),
  ]);

  return {
    visits,
    pqrs,
    reservations,
    overdueAccounts,
  };
}

export async function listReportTowers() {
  return db.tower.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getVisitsExportRows(filters: ReportFilters = {}, take = 100, page = 1) {
  const visits = await db.visit.findMany({
    where: buildVisitWhere(filters),
    take,
    skip: (page - 1) * take,
    select: {
      code: true,
      status: true,
      scheduledStart: true,
      scheduledEnd: true,
      visitor: {
        select: {
          fullName: true,
          document: true,
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
      resident: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { scheduledStart: "desc" },
  });

  return visits.map((visit) => ({
    codigo: visit.code,
    estado: visit.status,
    visitante: visit.visitor.fullName,
    documento: visit.visitor.document,
    torre: visit.apartment.tower.name,
    apartamento: visit.apartment.number,
    residente: `${visit.resident.firstName} ${visit.resident.lastName}`,
    ingreso_programado: visit.scheduledStart.toISOString(),
    salida_programada: visit.scheduledEnd.toISOString(),
  }));
}

export async function getVisitsExportTotal(filters: ReportFilters = {}) {
  return db.visit.count({
    where: buildVisitWhere(filters),
  });
}

export async function getVisitsTimeline(filters: ReportFilters = {}, days = 30) {
  const end = filters.endDate ? new Date(`${filters.endDate}T23:59:59.999`) : new Date();
  const start = filters.startDate
    ? new Date(`${filters.startDate}T00:00:00`)
    : new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);

  const visits = await db.visit.findMany({
    where: {
      ...buildVisitWhere(filters),
      scheduledStart: { gte: start, lte: end },
    },
    select: { scheduledStart: true },
  });

  const counts = new Map<string, number>();
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(5, 10); // MM-DD
    counts.set(key, 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const visit of visits) {
    const key = visit.scheduledStart.toISOString().slice(5, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([date, visits]) => ({ date, visits }));
}

export async function getPqrsPriorityBreakdown(filters: ReportFilters = {}) {
  const grouped = await db.pqrs.groupBy({
    by: ["priority"],
    _count: true,
    where: buildPqrsWhere(filters),
  });
  return grouped.map((g) => ({ name: g.priority, value: g._count }));
}

export async function getReservationsByAreaBreakdown(filters: ReportFilters = {}) {
  const reservations = await db.reservation.findMany({
    where: buildReservationWhere(filters),
    select: { area: { select: { name: true } } },
  });
  const counts = new Map<string, number>();
  for (const r of reservations) {
    counts.set(r.area.name, (counts.get(r.area.name) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}
