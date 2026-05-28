import { Role } from "@prisma/client";

import { requireRole } from "@/server/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole([Role.ADMIN]);
  return <>{children}</>;
}
