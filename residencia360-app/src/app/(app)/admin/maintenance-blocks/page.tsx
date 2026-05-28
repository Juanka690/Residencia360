import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteMaintenanceBlockAction } from "@/server/actions/admin";
import { formatDateTime } from "@/lib/utils";

import { MaintenanceBlockForm } from "./maintenance-block-form";

export default async function MaintenanceBlocksPage() {
  await requireRole([Role.ADMIN]);

  const [areas, blocks] = await Promise.all([
    db.commonArea.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.maintenanceBlock.findMany({
      include: { area: true },
      orderBy: { startAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <PageShell title="Bloqueos de mantenimiento" description="Franjas en las que no se aceptan reservas.">
      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo bloqueo</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceBlockForm areas={areas} />
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
                  <TableHead>Zona</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>{block.area.name}</TableCell>
                    <TableCell>{formatDateTime(block.startAt)}</TableCell>
                    <TableCell>{formatDateTime(block.endAt)}</TableCell>
                    <TableCell>{block.reason}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={async () => {
                          "use server";
                          return deleteMaintenanceBlockAction(block.id);
                        }}
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
