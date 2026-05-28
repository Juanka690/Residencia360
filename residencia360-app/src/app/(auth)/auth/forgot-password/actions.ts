"use server";

import { z } from "zod";

import { createPasswordResetToken } from "@/server/auth/password";

const schema = z.object({
  email: z.string().email(),
});

export async function requestPasswordReset(input: { email: string }) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Correo invalido." };
  }

  const token = await createPasswordResetToken(parsed.data.email);

  return {
    success: true,
    message: token
      ? "Solicitud registrada. Usa el enlace generado localmente."
      : "Si el correo existe, la solicitud fue registrada.",
    token,
  };
}
