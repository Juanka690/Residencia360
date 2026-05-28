export type CanalNotificacion = "IN_APP" | "EMAIL";

export type MensajeNotificacion = {
  type: string;
  title: string;
  body: string;
  link?: string;
  htmlBody?: string;
  metadata?: Record<string, unknown>;
};

export type DestinoNotificacion = {
  userId: string;
  email?: string | null;
  fullName?: string;
};

export interface INotificacionChannel {
  readonly canal: CanalNotificacion;
  enviar(destino: DestinoNotificacion, mensaje: MensajeNotificacion): Promise<{ delivered: boolean; error?: string }>;
}
