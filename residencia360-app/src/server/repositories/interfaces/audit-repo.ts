export interface IAuditRepo {
  registrar(entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    detail: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void>;
}
