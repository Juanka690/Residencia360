import type { Pqrs, PqrsAttachment, PqrsComment, PqrsStatus } from "@prisma/client";

export type PqrsWithRefs = Pqrs & {
  comments: PqrsComment[];
  attachments: PqrsAttachment[];
  resident: { id: string; firstName: string; lastName: string; email: string };
};

export interface IPqrsRepo {
  findById(id: string): Promise<PqrsWithRefs | null>;
  count(): Promise<number>;
  updateStatus(
    id: string,
    status: PqrsStatus,
    fields: Partial<Pick<Pqrs, "closedAt" | "assignedToId">>,
  ): Promise<Pqrs>;
}
