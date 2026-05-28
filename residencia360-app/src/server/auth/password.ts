import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";

export async function createPasswordResetToken(email: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return null;
  }

  const token = randomBytes(24).toString("hex");
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  await db.auditLog.create({
    data: {
      actorId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "Auth",
      detail: "Solicitud de recuperacion de contrasena.",
    },
  });

  return token;
}

export async function consumePasswordResetToken(token: string, password: string) {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return false;
  }

  await db.user.update({
    where: { id: resetToken.userId },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await db.passwordResetToken.update({
    where: { id: resetToken.id },
    data: {
      usedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      actorId: resetToken.userId,
      action: "PASSWORD_RESET_COMPLETED",
      entityType: "Auth",
      detail: "Contrasena actualizada desde flujo de recuperacion.",
    },
  });

  return true;
}
