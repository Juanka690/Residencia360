import type { Visit, VisitStatus } from "@prisma/client";

export type VisitWithRefs = Visit & {
  visitor: { id: string; fullName: string; document: string; vehiclePlate: string | null };
  apartment: { id: string; apartmentCode: string };
  resident: { id: string; firstName: string; lastName: string; email: string };
};

export interface IVisitRepo {
  findById(id: string): Promise<VisitWithRefs | null>;
  findByCode(code: string): Promise<VisitWithRefs | null>;
  findByToken(token: string): Promise<VisitWithRefs | null>;
  updateStatus(
    id: string,
    status: VisitStatus,
    fields: Partial<Pick<Visit, "approvedAt" | "approvedById" | "checkedInAt" | "guardInId" | "checkedOutAt" | "guardOutId">>,
  ): Promise<Visit>;
}
