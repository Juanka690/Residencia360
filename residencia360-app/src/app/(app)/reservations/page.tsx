import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { ReservationStatusPill } from "@/components/status-pill";
import { formatDateTime } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { listCommonAreas, listReservationBlocks, listReservations } from "@/server/services/reservations";
import { ReservationForm, ReservationReviewActions } from "@/app/(app)/reservations/reservation-form";

export default async function ReservationsPage() {
  const user = await requirePath("/reservations");
  const [reservations, blocks, areas] = await Promise.all([
    listReservations(user.role, user.id),
    listReservationBlocks(),
    listCommonAreas(),
  ]);

  return (
    <div className="space-y-6">
      <PageShell title="Reservas de zonas comunes" description="Calendario operativo con reglas por mora, anticipacion, cupos y mantenimiento.">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-2xl border border-border bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium">{reservation.area.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(reservation.startAt)} a {formatDateTime(reservation.endAt)}
                    </p>
                  </div>
                  <ReservationStatusPill status={reservation.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{reservation.purpose}</p>
                {(user.role === "ADMIN" || user.role === "BOARD") && reservation.status === "PENDING" ? (
                  <div className="mt-4">
                    <ReservationReviewActions reservationId={reservation.id} actorId={user.id} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bloqueos por mantenimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blocks.map((block) => (
                <div key={block.id} className="rounded-2xl border border-border p-3">
                  <p className="font-medium">{block.area.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(block.startAt)} · {block.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageShell>
      {user.role === "RESIDENT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Nueva reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <ReservationForm residentId={user.id} apartmentId={user.apartmentId!} areas={areas.map((area) => ({ id: area.id, name: area.name }))} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
