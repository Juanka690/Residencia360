import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { requirePath } from "@/server/auth/session";
import { getParkingOverview } from "@/server/services/parking";

export default async function ParkingPage() {
  await requirePath("/parking");
  const overview = await getParkingOverview();

  return (
    <PageShell title="Parqueaderos de visitantes" description="Disponibilidad actual y futura con control de asignacion por franja horaria.">
      <div className="mb-4">
        <Badge variant="outline">{overview.activeAssignments} cupos ocupados en este momento</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overview.spots.map((spot) => {
          const active = spot.assignments[0];
          return (
            <Card key={spot.id}>
              <CardHeader>
                <CardTitle>{spot.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {active ? <p>Ocupado por {active.visit?.visitor.fullName ?? active.providerAccess?.provider.name}</p> : <p>Disponible</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
