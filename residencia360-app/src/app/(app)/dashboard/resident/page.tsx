import { CreditCard, Ticket, UserRoundPlus, Volleyball } from "lucide-react";
import { Role } from "@prisma/client";

import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { getDashboardMetrics, getRecentActivity } from "@/server/services/dashboard";
import { requireRole } from "@/server/auth/session";

export default async function ResidentDashboardPage() {
  const user = await requireRole([Role.RESIDENT]);
  const [metrics, activity] = await Promise.all([
    getDashboardMetrics(user.role, user.id, user.apartmentId),
    getRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      <PageShell title="Dashboard residente" description="Resumen operativo de visitas, PQRS, reservas y cartera para tu apartamento.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Visitas activas" value={String(metrics.upcomingVisits ?? 0)} description="Pendientes, aprobadas o en curso." icon={UserRoundPlus} />
          <MetricCard title="PQRS abiertas" value={String(metrics.activePqrs ?? 0)} description="Solicitudes con seguimiento activo." icon={Ticket} />
          <MetricCard title="Reservas" value={String(metrics.pendingReservations ?? 0)} description="Reservas pendientes o aprobadas." icon={Volleyball} />
          <MetricCard title="Saldo" value={`$${metrics.accountBalance ?? 0}`} description="Balance consolidado del apartamento." icon={CreditCard} />
        </div>
      </PageShell>
      <div className="space-y-3">
        {activity.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
            {entry.detail}
          </div>
        ))}
      </div>
    </div>
  );
}
