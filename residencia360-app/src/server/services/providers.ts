import { db } from "@/lib/db";

export async function listProviders() {
  return listProvidersPage();
}

export async function listProvidersPage(page = 1, pageSize = 20) {
  const [rows, total] = await Promise.all([
    db.providerAccess.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        activity: true,
        status: true,
        scheduledStart: true,
        scheduledEnd: true,
        provider: {
          select: {
            name: true,
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
    db.providerAccess.count(),
  ]);

  return { rows, total, totalPages: Math.ceil(total / pageSize), page, pageSize };
}
