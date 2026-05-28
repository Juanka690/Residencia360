import { FileDown } from "lucide-react";

import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { formatDateTime, parsePageParam, safeSearchParams } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { getBasicReportSummary, getVisitsExportRows, getVisitsExportTotal, listReportTowers } from "@/server/services/reports";

const VISIT_STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PRE_REGISTERED", label: "Pre-registrada" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "CHECKED_IN", label: "Ingresada" },
  { value: "COMPLETED", label: "Completada" },
  { value: "CANCELLED", label: "Cancelada" },
  { value: "REJECTED", label: "Rechazada" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePath("/reports");
  const params = await searchParams;
  const filters = {
    startDate: safeSearchParams(params?.startDate),
    endDate: safeSearchParams(params?.endDate),
    towerId: safeSearchParams(params?.towerId),
    visitStatus: safeSearchParams(params?.visitStatus),
  };
  const page = parsePageParam(params?.page);
  const pageSize = 25;

  const [summary, exportRows, towers, totalVisits] = await Promise.all([
    getBasicReportSummary(filters),
    getVisitsExportRows(filters, pageSize, page),
    listReportTowers(),
    getVisitsExportTotal(filters),
  ]);
  const exportParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) exportParams.set(key, value);
  });
  const exportHref = `/api/reports/visits?${exportParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageShell title="Reportes" description="Metricas basicas de visitas, PQRS, reservas y cartera con exportacion CSV.">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="startDate">Desde</label>
                <input id="startDate" name="startDate" type="date" defaultValue={filters.startDate} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="endDate">Hasta</label>
                <input id="endDate" name="endDate" type="date" defaultValue={filters.endDate} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="towerId">Torre</label>
                <select id="towerId" name="towerId" defaultValue={filters.towerId} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Todas las torres</option>
                  {towers.map((tower) => (
                    <option key={tower.id} value={tower.id}>
                      {tower.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="visitStatus">Estado visita</label>
                <select id="visitStatus" name="visitStatus" defaultValue={filters.visitStatus} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {VISIT_STATUS_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2 md:col-span-4">
                <Button type="submit">Aplicar filtros</Button>
                <Button asChild variant="outline">
                  <a href="/reports">Limpiar</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardHeader><CardTitle>Visitas</CardTitle></CardHeader><CardContent>{summary.visits.map((item) => `${item.status}: ${item._count}`).join(" - ") || "Sin datos"}</CardContent></Card>
          <Card><CardHeader><CardTitle>PQRS</CardTitle></CardHeader><CardContent>{summary.pqrs.map((item) => `${item.status}: ${item._count}`).join(" - ") || "Sin datos"}</CardContent></Card>
          <Card><CardHeader><CardTitle>Reservas</CardTitle></CardHeader><CardContent>{summary.reservations.map((item) => `${item.status}: ${item._count}`).join(" - ") || "Sin datos"}</CardContent></Card>
          <Card><CardHeader><CardTitle>Cartera</CardTitle></CardHeader><CardContent>{summary.overdueAccounts} apartamentos en mora</CardContent></Card>
        </div>
      </PageShell>
      <Card>
        <CardHeader>
          <CardTitle>Exportaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href={exportHref}>
              <FileDown className="h-4 w-4" />
              Exportar visitas CSV
            </a>
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Visitas visibles</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2">Codigo</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Visitante</th>
                <th className="px-3 py-2">Torre</th>
                <th className="px-3 py-2">Apartamento</th>
                <th className="px-3 py-2">Residente</th>
                <th className="px-3 py-2">Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {exportRows.length > 0 ? (
                exportRows.map((row) => (
                  <tr key={row.codigo} className="border-b border-border/70">
                    <td className="px-3 py-2">{row.codigo}</td>
                    <td className="px-3 py-2">{row.estado}</td>
                    <td className="px-3 py-2">{row.visitante}</td>
                    <td className="px-3 py-2">{row.torre}</td>
                    <td className="px-3 py-2">{row.apartamento}</td>
                    <td className="px-3 py-2">{row.residente}</td>
                    <td className="px-3 py-2">{formatDateTime(row.ingreso_programado)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={7}>
                    No hay visitas para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="mt-4">
            <PaginationControls
              pathname="/reports"
              page={page}
              totalPages={Math.max(1, Math.ceil(totalVisits / pageSize))}
              searchParams={filters}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
