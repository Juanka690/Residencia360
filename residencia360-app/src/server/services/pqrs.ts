import { Role } from "@prisma/client";

import { db } from "@/lib/db";

export async function listPqrs(role: Role, userId: string) {
  return db.pqrs.findMany({
    where:
      role === Role.RESIDENT
        ? {
            residentId: userId,
          }
        : undefined,
    include: {
      resident: true,
      apartment: { include: { tower: true } },
      assignedTo: true,
      attachments: true,
      comments: { include: { author: true }, orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}
