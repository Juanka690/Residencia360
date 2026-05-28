import { CreditCard, Ticket, UserRoundPlus, Volleyball } from "lucide-react";
import { Role } from "@prisma/client";

import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { currency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getDashboardMetrics } from "@/server/services/dashboard";

export default async function BoardDashboardPage() {
  const user = await requireRole([Role.BOARD]);
  const metrics = await getDashboardMetrics(user.role, user.id);

  return (
    <PageShell title="Dashboard consejo" description="Vista ejecutiva para supervision de servicio, seguridad y resultados operativos.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Visitas hoy" value={String(metrics.visitsToday ?? 0)} description="Actividad de accesos del dia." icon={UserRoundPlus} />
        <MetricCard title="PQRS abiertas" value={String(metrics.openPqrs ?? 0)} description="Casos activos en seguimiento." icon={Ticket} />
        <MetricCard title="Reservas pendientes" value={String(metrics.pendingReservations ?? 0)} description="Solicitudes por aprobar o revisar." icon={Volleyball} />
        <MetricCard title="Cartera vencida" value={currency(metrics.overdueAmount ?? 0)} description="Exposicion actual por mora." icon={CreditCard} />
      </div>
    </PageShell>
  );
}
