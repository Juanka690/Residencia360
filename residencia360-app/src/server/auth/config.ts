import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "@/lib/db";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_MINUTES = 15;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Email y contrasena",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const now = new Date();
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user) {
            await db.auditLog.create({
              data: {
                action: "LOGIN_FAILURE",
                entityType: "Auth",
                detail: `Intento de inicio fallido para ${credentials.email.toLowerCase()}.`,
              },
            });
            return null;
          }

          if (user.lockedUntil && user.lockedUntil > now) {
            await db.auditLog.create({
              data: {
                actorId: user.id,
                action: "LOGIN_BLOCKED",
                entityType: "Auth",
                detail: `Cuenta bloqueada hasta ${user.lockedUntil.toISOString()} por intentos fallidos consecutivos.`,
              },
            });
            throw new Error("ACCOUNT_LOCKED");
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

          if (!isValid) {
            const nextFailedLoginCount = user.failedLoginCount + 1;
            const shouldLock = nextFailedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS;

            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginCount: shouldLock ? 0 : nextFailedLoginCount,
                lockedUntil: shouldLock ? new Date(now.getTime() + ACCOUNT_LOCK_MINUTES * 60 * 1000) : null,
              },
            });
            await db.auditLog.create({
              data: {
                actorId: user.id,
                action: shouldLock ? "LOGIN_LOCKED" : "LOGIN_FAILURE",
                entityType: "Auth",
                detail: shouldLock
                  ? `Cuenta bloqueada por ${ACCOUNT_LOCK_MINUTES} minutos tras ${MAX_FAILED_LOGIN_ATTEMPTS} intentos fallidos.`
                  : `Contrasena invalida. Intento fallido ${nextFailedLoginCount} de ${MAX_FAILED_LOGIN_ATTEMPTS}.`,
              },
            });
            if (shouldLock) {
              throw new Error("ACCOUNT_LOCKED");
            }
            return null;
          }

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            },
          });

          await db.auditLog.create({
            data: {
              actorId: user.id,
              action: "LOGIN_SUCCESS",
              entityType: "Auth",
              detail: "Inicio de sesion exitoso.",
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            apartmentId: user.apartmentId,
            towerId: user.towerId,
          };
        } catch (error) {
          if (error instanceof Error && error.message === "ACCOUNT_LOCKED") {
            throw error;
          }
          console.error("AUTH_AUTHORIZE_ERROR", error);
          throw new Error("AUTH_SERVICE_UNAVAILABLE");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.apartmentId = user.apartmentId;
        token.towerId = user.towerId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role!;
        session.user.apartmentId = token.apartmentId;
        session.user.towerId = token.towerId;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};
