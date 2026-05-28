import type { INotificationRepo } from "@/server/repositories/interfaces/notification-repo";
import { notificationRepo as defaultRepo } from "@/server/repositories/prisma/notification-repo";

import type { DestinoNotificacion, INotificacionChannel, MensajeNotificacion } from "./notification-channel";

export class InAppChannel implements INotificacionChannel {
  readonly canal = "IN_APP" as const;
  constructor(private readonly repo: INotificationRepo = defaultRepo) {}

  async enviar(destino: DestinoNotificacion, mensaje: MensajeNotificacion) {
    try {
      await this.repo.crear({
        userId: destino.userId,
        type: mensaje.type,
        title: mensaje.title,
        body: mensaje.body,
        link: mensaje.link ?? null,
        metadata: mensaje.metadata as never,
      });
      return { delivered: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      return { delivered: false, error: message };
    }
  }
}
