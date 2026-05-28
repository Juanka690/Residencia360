"use server";

import { z } from "zod";

import { consumePasswordResetToken } from "@/server/auth/password";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La nueva contrasena debe tener al menos 8 caracteres."),
});

export async function resetPassword(input: { token: string; password: string }) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos invalidos." };
  }

  const ok = await consumePasswordResetToken(parsed.data.token, parsed.data.password);
  return {
    success: ok,
    message: ok ? "Contrasena actualizada." : "El enlace no es valido o ya expiro.",
  };
}
