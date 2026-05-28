import { db } from "@/lib/db";
import type { CrearNotificacion, INotificationRepo } from "@/server/repositories/interfaces/notification-repo";

export class NotificationRepoPrisma implements INotificationRepo {
  async crear(input: CrearNotificacion) {
    const created = await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        metadata: input.metadata ?? undefined,
      },
      select: { id: true },
    });
    return created;
  }

  async marcarLeida(id: string, userId: string): Promise<void> {
    await db.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  listarPendientes(userId: string, limit = 20) {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const notificationRepo = new NotificationRepoPrisma();
