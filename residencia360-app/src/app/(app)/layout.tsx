import { redirect } from "next/navigation";

import { ProtectedShell } from "@/components/protected-shell";
import { auth } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <ProtectedShell session={session} title="Residencia360" subtitle="Centro de control de Altos de Santa Clara.">
      {children}
    </ProtectedShell>
  );
}
