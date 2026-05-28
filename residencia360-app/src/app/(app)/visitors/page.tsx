import { VisitForm, VisitStatusActions } from "@/app/(app)/visitors/visit-form";
import { VisitorsTable } from "@/app/(app)/visitors/visitors-table";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, parsePageParam } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { listVisitsPage } from "@/server/services/visits";

export default async function VisitorsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePath("/visitors");
  const params = await searchParams;
  const page = parsePageParam(params?.page);
  const visitsPage = await listVisitsPage(user.role, user.id, user.apartmentId, page);
  const visits = visitsPage.rows;

  return (
    <div className="space-y-6">
      <PageShell
        title="Visitantes"
        description="Pre-registro, aprobacion, consulta y trazabilidad completa del flujo de visitas."
        actions={<PaginationControls pathname="/visitors" page={visitsPage.page} totalPages={visitsPage.totalPages} />}
      >
        <VisitorsTable visits={visits} />
      </PageShell>
      {user.role === "RESIDENT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo pre-registro</CardTitle>
          </CardHeader>
          <CardContent>
            <VisitForm actorId={user.id} residentId={user.id} apartmentId={user.apartmentId!} />
          </CardContent>
        </Card>
      ) : null}
      {(user.role === "ADMIN" || user.role === "RESIDENT") && visits.some((visit) => visit.status === "PRE_REGISTERED") ? (
        <Card>
          <CardHeader>
            <CardTitle>Visitas pendientes de decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visits
              .filter((visit) => visit.status === "PRE_REGISTERED")
              .slice(0, 5)
              .map((visit) => (
                <div key={visit.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">{visit.visitor.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {visit.apartment.tower.name} - {visit.apartment.number} - {formatDateTime(visit.scheduledStart)}
                    </p>
                  </div>
                  <VisitStatusActions visitId={visit.id} actorId={user.id} currentStatus={visit.status} />
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
