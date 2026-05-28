"use client";

import { usePathname } from "next/navigation";
import { Session } from "next-auth";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function ProtectedShell({
  session,
  title,
  subtitle,
  children,
}: {
  session: Session;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <AppSidebar role={session.user.role} pathname={pathname} />
        <div className="flex min-h-screen flex-1 flex-col">
          <AppHeader session={session} title={title} subtitle={subtitle} />
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
