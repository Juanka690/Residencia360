import Link from "next/link";
import { Role } from "@prisma/client";
import { Bell, CarFront, ClipboardList, CreditCard, LayoutDashboard, Shield, SquareTerminal, Ticket, Users } from "lucide-react";

import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/brand";

const navigation = {
  resident: [
    { href: "/dashboard/resident", label: "Dashboard", icon: LayoutDashboard },
    { href: "/visitors", label: "Visitantes", icon: Users },
    { href: "/pqrs", label: "PQRS", icon: Ticket },
    { href: "/reservations", label: "Reservas", icon: ClipboardList },
    { href: "/announcements", label: "Anuncios", icon: Bell },
    { href: "/accounting", label: "Cartera", icon: CreditCard },
  ],
  guard: [
    { href: "/dashboard/guard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/gate", label: "Porteria", icon: Shield },
    { href: "/visitors", label: "Visitantes", icon: Users },
    { href: "/providers", label: "Proveedores", icon: SquareTerminal },
    { href: "/parking", label: "Parqueaderos", icon: CarFront },
    { href: "/announcements", label: "Anuncios", icon: Bell },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/visitors", label: "Visitantes", icon: Users },
    { href: "/gate", label: "Porteria", icon: Shield },
    { href: "/pqrs", label: "PQRS", icon: Ticket },
    { href: "/reservations", label: "Reservas", icon: ClipboardList },
    { href: "/providers", label: "Proveedores", icon: SquareTerminal },
    { href: "/parking", label: "Parqueaderos", icon: CarFront },
    { href: "/announcements", label: "Anuncios", icon: Bell },
    { href: "/accounting", label: "Cartera", icon: CreditCard },
    { href: "/reports", label: "Reportes", icon: ClipboardList },
    { href: "/audit", label: "Auditoria", icon: Shield },
  ],
  board: [
    { href: "/dashboard/board", label: "Dashboard", icon: LayoutDashboard },
    { href: "/announcements", label: "Anuncios", icon: Bell },
    { href: "/pqrs", label: "PQRS", icon: Ticket },
    { href: "/reservations", label: "Reservas", icon: ClipboardList },
    { href: "/reports", label: "Reportes", icon: ClipboardList },
    { href: "/audit", label: "Auditoria", icon: Shield },
  ],
  contractor: [{ href: "/providers", label: "Servicios", icon: SquareTerminal }],
} as const;

function getItems(role: Role) {
  switch (role) {
    case Role.RESIDENT:
      return navigation.resident;
    case Role.GUARD:
      return navigation.guard;
    case Role.ADMIN:
      return navigation.admin;
    case Role.BOARD:
      return navigation.board;
    case Role.CONTRACTOR:
      return navigation.contractor;
    default:
      return [];
  }
}

export function AppSidebar({
  role,
  pathname,
}: {
  role: Role;
  pathname: string;
}) {
  const items = getItems(role);

  return (
    <aside className="hidden w-72 border-r border-border bg-white/85 px-5 py-6 lg:block">
      <Brand />
      <div className="mt-10 rounded-2xl border border-border bg-secondary/40 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Perfil activo</p>
        <p className="mt-2 text-sm font-semibold">{ROLE_LABELS[role]}</p>
        <p className="text-sm text-muted-foreground">Operacion segura y trazable para la unidad.</p>
      </div>
      <nav className="mt-8 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
