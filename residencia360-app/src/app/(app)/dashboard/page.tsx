import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth/session";
import { defaultDashboardByRole } from "@/server/auth/permissions";

export default async function DashboardIndexPage() {
  const user = await requireUser();
  redirect(defaultDashboardByRole(user.role));
}
