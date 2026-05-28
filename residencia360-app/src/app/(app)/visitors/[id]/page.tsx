import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitStatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";
import { toQrDataUrl } from "@/lib/qr";
import { requirePath } from "@/server/auth/session";
import { listVisits } from "@/server/services/visits";

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePath("/visitors");
  const visits = await listVisits(user.role, user.id, user.apartmentId);
  const visit = visits.find((item) => item.id === id);

  if (!visit) {
    return <div className="text-sm text-muted-foreground">Visita no encontrada.</div>;
  }

  const qrDataUrl = await toQrDataUrl(visit.qrToken);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader>
          <CardTitle>Detalle de visita {visit.code}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Visitante</p>
            <p className="font-medium">{visit.visitor.fullName}</p>
            <p className="text-sm text-muted-foreground">{visit.visitor.document}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <VisitStatusPill status={visit.status} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Apartamento</p>
            <p className="font-medium">{visit.apartment.tower.name} · {visit.apartment.number}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Residente autorizador</p>
            <p className="font-medium">{visit.resident.firstName} {visit.resident.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ingreso programado</p>
            <p className="font-medium">{formatDateTime(visit.scheduledStart)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Salida programada</p>
            <p className="font-medium">{formatDateTime(visit.scheduledEnd)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Motivo</p>
            <p className="font-medium">{visit.reason}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>QR de ingreso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-[240px] w-[240px] items-center justify-center rounded-3xl border border-border bg-white">
            <Image src={qrDataUrl} alt="QR visita" width={220} height={220} />
          </div>
          <p className="text-sm text-muted-foreground">Codigo alterno: {visit.code} · Token: {visit.qrToken}</p>
        </CardContent>
      </Card>
    </div>
  );
}
