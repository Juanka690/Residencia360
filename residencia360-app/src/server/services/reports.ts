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
