import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteParkingSpotAction } from "@/server/actions/admin";

import { ParkingSpotForm } from "./parking-spot-form";

export default async function ParkingSpotsAdminPage() {
  await requireRole([Role.ADMIN]);

  const spots = await db.parkingSpot.findMany({
    include: { _count: { select: { assignments: true } } },
    orderBy: { label: "asc" },
  });

  return (
    <PageShell title="Parqueaderos" description="Cupos de visitantes y su estado.">
      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo cupo</CardTitle>
          </CardHeader>
          <CardContent>
            <ParkingSpotForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etiqueta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Asignaciones historicas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spots.map((spot) => (
                  <TableRow key={spot.id}>
                    <TableCell className="font-medium">{spot.label}</TableCell>
                    <TableCell>{spot.type}</TableCell>
                    <TableCell>{spot._count.assignments}</TableCell>
                    <TableCell>
                      <Badge variant={spot.isActive ? "default" : "secondary"}>
                        {spot.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={async () => {
                          "use server";
                          return deleteParkingSpotAction(spot.id);
                        }}
                        confirmText={`Eliminar ${spot.label}?`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
