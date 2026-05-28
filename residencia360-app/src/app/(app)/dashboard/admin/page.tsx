import { CreditCard, Ticket, UserRoundPlus, Volleyball } from "lucide-react";
import { Role } from "@prisma/client";

import { MetricCard } from "@/components/metric-card";
import { PageShell } from "@/components/page-shell";
import { currency } from "@/lib/utils";
import { requireRole } from "@/server/auth/session";
import { getDashboardMetrics, getRecentActivity } from "@/server/services/dashboard";

export default async function AdminDashboardPage() {
  const user = await requireRole([Role.ADMIN]);
  const [metrics, activity] = await Promise.all([
    getDashboardMetrics(user.role, user.id),
    getRecentActivity(),
  ]);

  return (
    <div className="space-y-6">
      <PageShell title="Dashboard administracion" description="Indicadores centrales de visitas, PQRS, reservas y cartera para la unidad.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Visitas hoy" value={String(metrics.visitsToday ?? 0)} description="Ingresos programados en la jornada." icon={UserRoundPlus} />
          <MetricCard title="PQRS abiertas" value={String(metrics.openPqrs ?? 0)} description="Tickets pendientes de cierre." icon={Ticket} />
          <MetricCard title="Reservas por revisar" value={String(metrics.pendingReservations ?? 0)} description="Solicitudes esperando decision." icon={Volleyball} />
          <MetricCard title="Cartera en mora" value={currency(metrics.overdueAmount ?? 0)} description="Saldo vencido acumulado." icon={CreditCard} />
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
