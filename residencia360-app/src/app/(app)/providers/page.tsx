import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, parsePageParam } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { listProvidersPage } from "@/server/services/providers";

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePath("/providers");
  const params = await searchParams;
  const page = parsePageParam(params?.page);
  const providersPage = await listProvidersPage(page);
  const providers = providersPage.rows;

  return (
    <PageShell
      title="Proveedores y contratistas"
      description="Catalogo de accesos autorizados, ventanas de ingreso y relacion con PQRS u ordenes de trabajo."
      actions={<PaginationControls pathname="/providers" page={providersPage.page} totalPages={providersPage.totalPages} />}
    >
      <div className="space-y-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle>{provider.provider.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>Actividad: {provider.activity}</p>
              <p>Estado: <Badge variant="outline">{provider.status}</Badge></p>
              <p>Ventana: {formatDateTime(provider.scheduledStart)} a {formatDateTime(provider.scheduledEnd)}</p>
              <p>Apartamento: {provider.apartment ? `${provider.apartment.tower.name} · ${provider.apartment.number}` : "General"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
