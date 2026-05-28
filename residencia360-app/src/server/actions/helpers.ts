"use server";

import { db } from "@/lib/db";

export async function writeAuditLog(params: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail: string;
}) {
  await db.auditLog.create({
    data: {
      actorId: params.actorId ?? undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? undefined,
      detail: params.detail,
    },
  });
}
