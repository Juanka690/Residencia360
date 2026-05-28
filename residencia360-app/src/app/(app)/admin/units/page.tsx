import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteUnitAction } from "@/server/actions/admin";

import { UnitForm } from "./unit-form";

export default async function UnitsAdminPage() {
  await requireRole([Role.ADMIN]);

  const [towers, units] = await Promise.all([
    db.tower.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } }),
    db.residentialUnit.findMany({
      include: { tower: true, _count: { select: { residents: true } } },
      orderBy: [{ tower: { code: "asc" } }, { floor: "asc" }, { number: "asc" }],
      take: 200,
    }),
  ]);

  return (
    <PageShell title="Unidades residenciales" description="Apartamentos asociados a cada torre.">
      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva unidad</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitForm towers={towers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado (200 primeras)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Torre</TableHead>
                  <TableHead>Piso</TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Residentes</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.apartmentCode}</TableCell>
                    <TableCell>{unit.tower.name}</TableCell>
                    <TableCell>{unit.floor}</TableCell>
                    <TableCell>{unit.number}</TableCell>
                    <TableCell>{unit._count.residents}</TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={async () => {
                          "use server";
                          return deleteUnitAction(unit.id);
                        }}
                        confirmText={`Eliminar unidad ${unit.apartmentCode}?`}
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
