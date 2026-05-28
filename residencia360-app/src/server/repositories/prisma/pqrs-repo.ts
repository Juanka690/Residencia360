import type { Pqrs, PqrsStatus } from "@prisma/client";

import { db } from "@/lib/db";
import type { IPqrsRepo, PqrsWithRefs } from "@/server/repositories/interfaces/pqrs-repo";

export class PqrsRepoPrisma implements IPqrsRepo {
  async findById(id: string): Promise<PqrsWithRefs | null> {
    return db.pqrs.findUnique({
      where: { id },
      include: {
        comments: true,
        attachments: true,
        resident: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  count(): Promise<number> {
    return db.pqrs.count();
  }

  updateStatus(
    id: string,
    status: PqrsStatus,
    fields: Partial<Pick<Pqrs, "closedAt" | "assignedToId">>,
  ): Promise<Pqrs> {
    return db.pqrs.update({ where: { id }, data: { status, ...fields } });
  }
}

export const pqrsRepo = new PqrsRepoPrisma();
