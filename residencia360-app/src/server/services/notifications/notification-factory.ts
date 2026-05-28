import { EmailChannel } from "./channels/email-channel";
import { InAppChannel } from "./channels/in-app-channel";
import type { CanalNotificacion, INotificacionChannel } from "./channels/notification-channel";

/**
 * Patron Factory Method (Entregable 2 §4.5).
 * Devuelve la implementacion concreta del canal segun el identificador.
 * Anadir un canal nuevo (SMS, Push) requiere registrar una clase aqui sin tocar el consumidor.
 */
export class NotificationFactory {
  private readonly registry: Map<CanalNotificacion, INotificacionChannel>;

  constructor(channels?: INotificacionChannel[]) {
    const defaults = channels ?? [new InAppChannel(), new EmailChannel()];
    this.registry = new Map(defaults.map((c) => [c.canal, c]));
  }

  crear(canal: CanalNotificacion): INotificacionChannel {
    const channel = this.registry.get(canal);
    if (!channel) {
      throw new Error(`Canal de notificacion no registrado: ${canal}`);
    }
    return channel;
  }

  canales(): CanalNotificacion[] {
    return Array.from(this.registry.keys());
  }
}

export const notificationFactory = new NotificationFactory();
