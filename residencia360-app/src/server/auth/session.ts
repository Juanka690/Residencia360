import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { cache } from "react";

import { authOptions } from "@/server/auth/config";
import { canAccessPath, defaultDashboardByRole } from "@/server/auth/permissions";

export const auth = cache(async () => {
  return getServerSession(authOptions);
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  return session.user;
}

export async function requireRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect(defaultDashboardByRole(user.role));
  }
  return user;
}

export async function requirePath(pathname: string) {
  const user = await requireUser();
  if (!canAccessPath(user.role, pathname)) {
    redirect(defaultDashboardByRole(user.role));
  }
  return user;
}
