"use client";

import { signOut } from "next-auth/react";
import { BellRing, LogOut } from "lucide-react";
import { Session } from "next-auth";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function AppHeader({ session, title, subtitle }: { session: Session; title: string; subtitle?: string }) {
  return (
    <header className="flex flex-col gap-4 border-b border-border bg-white/75 px-4 py-4 backdrop-blur transition-colors lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <p className="text-sm text-muted-foreground">{subtitle ?? "Gestion operativa y administrativa en tiempo real."}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="outline" size="icon">
          <BellRing className="h-4 w-4" />
        </Button>
        <div className="hidden rounded-2xl border border-border bg-white px-4 py-2 md:block">
          <p className="text-sm font-medium">
            {session.user.name}
          </p>
          <Badge className="mt-1" variant="outline">
            {ROLE_LABELS[session.user.role]}
          </Badge>
        </div>
        <Avatar>
          <AvatarFallback>{initials(session.user.name?.split(" ")[0], session.user.name?.split(" ").slice(1).join(" "))}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
