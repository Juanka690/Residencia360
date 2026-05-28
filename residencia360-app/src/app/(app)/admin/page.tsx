import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { Role } from "@prisma/client";

const sections = [
  { href: "/admin/users", title: "Usuarios", description: "Alta, edicion, suspension y cambio de rol." },
  { href: "/admin/towers", title: "Torres", description: "Configura torres del conjunto." },
  { href: "/admin/units", title: "Unidades residenciales", description: "Apartamentos por torre y piso." },
  { href: "/admin/common-areas", title: "Zonas comunes", description: "Reglas de reserva y capacidad." },
  { href: "/admin/maintenance-blocks", title: "Bloqueos de mantenimiento", description: "Franjas no reservables." },
  { href: "/admin/providers", title: "Empresas proveedoras", description: "Catalogo de proveedores externos." },
  { href: "/admin/parking-spots", title: "Parqueaderos", description: "Cupos de visitantes y estados." },
];

export default async function AdminHomePage() {
  await requireRole([Role.ADMIN]);

  const [users, towers, units, commonAreas, providers, parkingSpots] = await Promise.all([
    db.user.count(),
    db.tower.count(),
    db.residentialUnit.count(),
    db.commonArea.count(),
    db.providerCompany.count(),
    db.parkingSpot.count(),
  ]);

  const stats: Record<string, number> = {
    "/admin/users": users,
    "/admin/towers": towers,
    "/admin/units": units,
    "/admin/common-areas": commonAreas,
    "/admin/providers": providers,
    "/admin/parking-spots": parkingSpots,
  };

  return (
    <PageShell
      title="Administracion"
      description="Configuracion maestra del conjunto, usuarios y reglas operativas."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-shadow hover:shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{section.title}</span>
                  {stats[section.href] != null ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      {stats[section.href]} registros
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{section.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
