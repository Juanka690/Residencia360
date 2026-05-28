import type { VisitStatus, Visit } from "@prisma/client";

import { db } from "@/lib/db";
import type { IVisitRepo, VisitWithRefs } from "@/server/repositories/interfaces/visit-repo";

const includeRefs = {
  visitor: { select: { id: true, fullName: true, document: true, vehiclePlate: true } },
  apartment: { select: { id: true, apartmentCode: true } },
  resident: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

export class VisitRepoPrisma implements IVisitRepo {
  async findById(id: string): Promise<VisitWithRefs | null> {
    return db.visit.findUnique({ where: { id }, include: includeRefs });
  }
  async findByCode(code: string): Promise<VisitWithRefs | null> {
    return db.visit.findUnique({ where: { code }, include: includeRefs });
  }
  async findByToken(token: string): Promise<VisitWithRefs | null> {
    return db.visit.findUnique({ where: { qrToken: token }, include: includeRefs });
  }
  async updateStatus(
    id: string,
    status: VisitStatus,
    fields: Partial<Pick<Visit, "approvedAt" | "approvedById" | "checkedInAt" | "guardInId" | "checkedOutAt" | "guardOutId">>,
  ): Promise<Visit> {
    return db.visit.update({ where: { id }, data: { status, ...fields } });
  }
}

export const visitRepo = new VisitRepoPrisma();
