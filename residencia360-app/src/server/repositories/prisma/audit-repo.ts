import { db } from "@/lib/db";
import type { IAuditRepo } from "@/server/repositories/interfaces/audit-repo";

export class AuditRepoPrisma implements IAuditRepo {
  async registrar(entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    detail: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId ?? undefined,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? undefined,
        detail: entry.detail,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }
}

export const auditRepo = new AuditRepoPrisma();
