import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCommonAreaAction } from "@/server/actions/admin";

import { CommonAreaForm } from "./common-area-form";

export default async function CommonAreasAdminPage() {
  await requireRole([Role.ADMIN]);

  const areas = await db.commonArea.findMany({
    include: { _count: { select: { reservations: true, maintenanceBlocks: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <PageShell title="Zonas comunes" description="Configura reglas de reserva y capacidades.">
      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva zona</CardTitle>
          </CardHeader>
          <CardContent>
            <CommonAreaForm />
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Antic. min.</TableHead>
                  <TableHead>Max semanal</TableHead>
                  <TableHead>Reservas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.capacity}</TableCell>
                    <TableCell>{area.minimumAdvanceHours} h</TableCell>
                    <TableCell>{area.maxActiveReservationsWeekly}</TableCell>
                    <TableCell>{area._count.reservations}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={async () => {
                          "use server";
                          return deleteCommonAreaAction(area.id);
                        }}
                        confirmText={`Eliminar zona ${area.name}?`}
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
