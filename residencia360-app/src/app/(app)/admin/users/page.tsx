import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { UserForm } from "./user-form";
import { UserRowActions } from "./user-row-actions";

export default async function UsersAdminPage() {
  await requireRole([Role.ADMIN]);

  const [users, towers, units] = await Promise.all([
    db.user.findMany({
      orderBy: { lastName: "asc" },
      include: { tower: true, apartment: true },
      take: 200,
    }),
    db.tower.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true } }),
    db.residentialUnit.findMany({
      orderBy: { apartmentCode: "asc" },
      select: { id: true, apartmentCode: true },
      take: 500,
    }),
  ]);

  return (
    <PageShell title="Usuarios" description="Gestion de cuentas y roles.">
      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm towers={towers} units={units} />
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
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Torre/Unidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.tower?.name ?? "-"}
                      {user.apartment?.apartmentCode ? ` · ${user.apartment.apartmentCode}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions userId={user.id} status={user.status} />
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
