import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteTowerAction } from "@/server/actions/admin";

import { TowerForm } from "./tower-form";

export default async function TowersAdminPage() {
  await requireRole([Role.ADMIN]);

  const towers = await db.tower.findMany({
    include: { _count: { select: { units: true, users: true } } },
    orderBy: { code: "asc" },
  });

  return (
    <PageShell title="Torres" description="Gestion de torres del conjunto.">
      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva torre</CardTitle>
          </CardHeader>
          <CardContent>
            <TowerForm />
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
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {towers.map((tower) => (
                  <TableRow key={tower.id}>
                    <TableCell className="font-medium">{tower.code}</TableCell>
                    <TableCell>{tower.name}</TableCell>
                    <TableCell>{tower._count.units}</TableCell>
                    <TableCell>{tower._count.users}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={async () => {
                          "use server";
                          return deleteTowerAction(tower.id);
                        }}
                        confirmText={`Eliminar torre ${tower.name}?`}
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
