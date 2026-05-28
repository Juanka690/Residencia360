import { db } from "@/lib/db";

export async function listAuditEntries() {
  return listAuditEntriesPage();
}

export async function listAuditEntriesPage(page = 1, pageSize = 20) {
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        action: true,
        detail: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        actor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.count(),
  ]);

  return { rows, total, totalPages: Math.ceil(total / pageSize), page, pageSize };
}
