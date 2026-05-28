// @ts-nocheck Deno runtime
// Edge Function: send-notification
// Enviada via supabase.functions.invoke('send-notification', { body: {...} }).
//
// Provider de email: usa RESEND_API_KEY si esta configurada. En caso contrario,
// degrada a log y retorna 200 (la notificacion in-app sigue persistiendo).

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type Payload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  recipientName?: string;
  type?: string;
  link?: string;
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders() },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.to || !payload.subject) {
    return json({ error: "Missing fields: to, subject" }, 400);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("RESEND_FROM_ADDRESS") ?? "Residencia360 <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(
      `[send-notification] RESEND_API_KEY no configurada; email simulado para ${payload.to}: ${payload.subject}`,
    );
    return json({ delivered: false, simulated: true, provider: "log" });
  }

  const html = payload.html ?? buildHtml(payload);
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [payload.to],
      subject: payload.subject,
      html,
      text: payload.text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[send-notification] Resend error", response.status, errorBody);
    return json({ delivered: false, error: errorBody }, 502);
  }

  const data = await response.json();
  return json({ delivered: true, providerId: data?.id });
});

function buildHtml(payload: Payload): string {
  const link = payload.link
    ? `<p style="margin-top:24px"><a href="${payload.link}" style="background:#1d4ed8;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Abrir Residencia360</a></p>`
    : "";
  const greeting = payload.recipientName ? `<p>Hola ${payload.recipientName},</p>` : "";
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h1 style="color:#1d4ed8;font-size:20px">${payload.subject}</h1>
      ${greeting}
      <p style="font-size:15px;line-height:1.6;white-space:pre-line">${payload.text ?? ""}</p>
      ${link}
      <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0" />
      <p style="font-size:12px;color:#64748b">Residencia360 - Notificacion automatica</p>
    </div>
  `;
}
