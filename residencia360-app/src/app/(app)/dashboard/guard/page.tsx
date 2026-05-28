import { CarFront, Shield, UserCheck, Users } from "lucide-react";
import { Role } from "@prisma/client";

import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { requireRole } from "@/server/auth/session";
import { getDashboardMetrics } from "@/server/services/dashboard";

export default async function GuardDashboardPage() {
  const user = await requireRole([Role.GUARD]);
  const metrics = await getDashboardMetrics(user.role, user.id, user.apartmentId);

  return (
    <PageShell title="Dashboard porteria" description="Control rapido de ingresos, salidas, parqueaderos y flujo de proveedores.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Ingresos pendientes" value={String(metrics.pendingEntries ?? 0)} description="Visitas aprobadas listas para validar." icon={Users} />
        <MetricCard title="Visitantes dentro" value={String(metrics.checkedInVisitors ?? 0)} description="Personas actualmente dentro de la unidad." icon={UserCheck} />
        <MetricCard title="Proveedores activos" value={String(metrics.providerEntries ?? 0)} description="Contratistas con ingreso aprobado o activo." icon={Shield} />
        <MetricCard title="Parqueaderos ocupados" value={String(metrics.occupiedSpots ?? 0)} description="Cupos de visitante en uso." icon={CarFront} />
      </div>
    </PageShell>
  );
}
