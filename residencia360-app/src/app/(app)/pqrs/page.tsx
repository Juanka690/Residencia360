import { PqrsForm, PqrsStatusActions } from "@/app/(app)/pqrs/pqrs-form";
import { PageShell } from "@/components/page-shell";
import { PqrsStatusPill } from "@/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { requirePath } from "@/server/auth/session";
import { listPqrs } from "@/server/services/pqrs";

export default async function PqrsPage() {
  const user = await requirePath("/pqrs");
  const tickets = await listPqrs(user.role, user.id);

  return (
    <div className="space-y-6">
      <PageShell title="PQRS" description="Gestiona solicitudes, prioridades, estados y seguimiento con SLA configurable.">
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{ticket.ticketNumber}</p>
                  <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{ticket.category} - SLA {formatDateTime(ticket.slaDueAt)}</p>
                </div>
                <PqrsStatusPill status={ticket.status} />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{ticket.description}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Radicado por</p>
                  <p className="font-medium">{ticket.resident.firstName} {ticket.resident.lastName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Responsable</p>
                  <p className="font-medium">{ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : "Sin asignar"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ultimo comentario</p>
                  <p className="font-medium">{ticket.comments[0]?.message ?? "Sin comentarios"}</p>
                </div>
              </div>
              {ticket.attachments.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Adjuntos</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ticket.attachments.map((attachment) => (
                      <span key={attachment.id} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                        {attachment.fileName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {ticket.comments.length > 0 ? (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-sm font-medium">
                        {comment.author.firstName} {comment.author.lastName}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{comment.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(comment.createdAt)}</p>
                      {comment.evidenceUrl ? <p className="mt-1 text-xs text-muted-foreground">Evidencia: {comment.evidenceUrl.split("/").pop()}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {(user.role === "ADMIN" || user.role === "BOARD") ? (
                <div className="mt-4">
                  <PqrsStatusActions pqrsId={ticket.id} actorId={user.id} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </PageShell>
      {user.role === "RESIDENT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Radicar nueva PQRS</CardTitle>
          </CardHeader>
          <CardContent>
            <PqrsForm residentId={user.id} apartmentId={user.apartmentId!} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
