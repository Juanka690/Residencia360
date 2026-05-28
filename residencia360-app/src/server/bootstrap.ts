/**
 * Punto de inicializacion del lado servidor.
 * Importa los modulos cuyo side-effect es suscribirse al EventBus.
 * Se llama una sola vez por proceso (idempotente).
 */
import { registrarNotificationObserver } from "@/server/services/notifications/notification-service";

let initialized = false;
export function bootstrapServer(): void {
  if (initialized) return;
  registrarNotificationObserver();
  initialized = true;
}

bootstrapServer();
