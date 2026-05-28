import type { Prisma } from "@prisma/client";

export type CrearNotificacion = {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export interface INotificationRepo {
  crear(input: CrearNotificacion): Promise<{ id: string }>;
  marcarLeida(id: string, userId: string): Promise<void>;
  listarPendientes(userId: string, limit?: number): Promise<unknown[]>;
}
