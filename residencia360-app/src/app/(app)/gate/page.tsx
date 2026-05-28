import { Search } from "lucide-react";

import { GateControls } from "@/app/(app)/gate/gate-controls";
import { QrScanner } from "@/app/(app)/gate/qr-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/page-shell";
import { VisitStatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { getGateQueue, searchVisitForGate } from "@/server/services/visits";

export default async function GatePage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>;
}) {
  const user = await requirePath("/gate");
  const params = await searchParams;
  const queue = await getGateQueue();
  const selected = params?.query ? await searchVisitForGate(params.query) : null;

  return (
    <div className="space-y-6">
      <PageShell title="Porteria" description="Valida ingresos y salidas por QR, codigo o documento dentro de la ventana autorizada.">
        <form className="flex flex-col gap-3 md:flex-row" action="/gate">
          <Input name="query" placeholder="Escanea QR, ingresa codigo VIS-0001 o documento..." defaultValue={params?.query} />
          <Button type="submit">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <QrScanner />
        </form>
        {selected ? (
          <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium">{selected.visitor.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {selected.code} · {selected.apartment.tower.name} {selected.apartment.number} · {formatDateTime(selected.scheduledStart)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <VisitStatusPill status={selected.status} />
                <GateControls visitId={selected.id} guardId={user.id} status={selected.status} />
              </div>
            </div>
          </div>
        ) : null}
      </PageShell>
      <Card>
        <CardHeader>
          <CardTitle>Cola operativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.map((visit) => (
            <div key={visit.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium">{visit.visitor.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {visit.code} · {visit.apartment.tower.name} {visit.apartment.number} · {visit.reason}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <VisitStatusPill status={visit.status} />
                <GateControls visitId={visit.id} guardId={user.id} status={visit.status} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
