import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/page-shell";
import { formatDateTime, parsePageParam } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { listAuditEntriesPage } from "@/server/services/audit";

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePath("/audit");
  const params = await searchParams;
  const page = parsePageParam(params?.page);
  const auditPage = await listAuditEntriesPage(page);
  const entries = auditPage.rows;

  return (
    <PageShell
      title="Bitacora de auditoria"
      description="Registro no editable de accesos, eventos operativos y acciones sensibles del sistema."
      actions={<PaginationControls pathname="/audit" page={auditPage.page} totalPages={auditPage.totalPages} />}
    >
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <CardTitle className="text-base">{entry.action}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{entry.detail}</p>
              <p>Entidad: {entry.entityType} {entry.entityId ? `· ${entry.entityId}` : ""}</p>
              <p>Actor: {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName}` : "Sistema"} · {formatDateTime(entry.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
