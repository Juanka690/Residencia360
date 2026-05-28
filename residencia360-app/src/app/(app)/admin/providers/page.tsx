import { Role } from "@prisma/client";

import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { requireRole } from "@/server/auth/session";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteProviderCompanyAction } from "@/server/actions/admin";

import { ProviderCompanyForm } from "./provider-company-form";

export default async function ProviderCompaniesPage() {
  await requireRole([Role.ADMIN]);

  const providers = await db.providerCompany.findMany({
    include: { _count: { select: { accesses: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <PageShell title="Empresas proveedoras" description="Catalogo de empresas autorizadas a operar en el conjunto.">
      <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderCompanyForm />
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
                  <TableHead>NIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Accesos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{provider.taxId ?? "-"}</TableCell>
                    <TableCell>
                      {provider.contactName} - {provider.contactPhone}
                    </TableCell>
                    <TableCell>{provider._count.accesses}</TableCell>
                    <TableCell>
                      <Badge variant={provider.isActive ? "default" : "secondary"}>
                        {provider.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteButton
                        action={async () => {
                          "use server";
                          return deleteProviderCompanyAction(provider.id);
                        }}
                        confirmText={`Eliminar ${provider.name}?`}
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
