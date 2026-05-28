import { createClient } from "@supabase/supabase-js";

import type { DestinoNotificacion, INotificacionChannel, MensajeNotificacion } from "./notification-channel";

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

const EMAIL_FUNCTION_NAME = "send-notification";

export class EmailChannel implements INotificacionChannel {
  readonly canal = "EMAIL" as const;

  async enviar(destino: DestinoNotificacion, mensaje: MensajeNotificacion) {
    if (!destino.email) {
      return { delivered: false, error: "destino sin email" };
    }
    const client = getServiceClient();
    if (!client) {
      // Modo desarrollo / sin configurar: degradar a log y no fallar.
      console.info(
        `[EmailChannel] Edge Function no configurada. Email a ${destino.email}: ${mensaje.title}`,
      );
      return { delivered: false, error: "edge_function_not_configured" };
    }

    const { error } = await client.functions.invoke(EMAIL_FUNCTION_NAME, {
      body: {
        to: destino.email,
        recipientName: destino.fullName,
        subject: mensaje.title,
        text: mensaje.body,
        html: mensaje.htmlBody ?? buildDefaultHtml(mensaje),
        type: mensaje.type,
        link: mensaje.link,
      },
    });

    if (error) {
      console.error("[EmailChannel] error en send-notification:", error);
      return { delivered: false, error: error.message };
    }
    return { delivered: true };
  }
}

function buildDefaultHtml(mensaje: MensajeNotificacion): string {
  const link = mensaje.link
    ? `<p style="margin-top:24px"><a href="${mensaje.link}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Abrir Residencia360</a></p>`
    : "";
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h1 style="color:#1d4ed8;font-size:20px">${mensaje.title}</h1>
      <p style="font-size:15px;line-height:1.6;white-space:pre-line">${mensaje.body}</p>
      ${link}
      <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0" />
      <p style="font-size:12px;color:#64748b">Residencia360 - Notificacion automatica</p>
    </div>
  `;
}
