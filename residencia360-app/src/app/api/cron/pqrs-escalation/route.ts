import { NextResponse } from "next/server";
import { PqrsStatus } from "@prisma/client";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";

/**
 * Endpoint para Vercel Cron. Se invoca periodicamente y dispara notificaciones
 * para PQRS con SLA proximo a vencer o vencido.
 *
 * Protegido por header `Authorization: Bearer ${CRON_SECRET}` si CRON_SECRET esta definido.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 4 * 60 * 60 * 1000); // proximas 4h

  const pendings = await db.pqrs.findMany({
    where: {
      status: { in: [PqrsStatus.FILED, PqrsStatus.IN_PROGRESS, PqrsStatus.THIRD_PARTY_PENDING] },
      slaDueAt: { lte: horizon },
    },
    select: {
      id: true,
      ticketNumber: true,
      residentId: true,
      assignedToId: true,
      priority: true,
      status: true,
      slaDueAt: true,
      subject: true,
    },
    take: 200,
  });

  await Promise.allSettled(
    pendings.map((pqrs) =>
      eventBus.publish(
        buildEvent(
          "PqrsSlaPorVencer",
          {
            pqrsId: pqrs.id,
            ticketNumber: pqrs.ticketNumber,
            residentId: pqrs.residentId,
            assignedToId: pqrs.assignedToId,
            priority: pqrs.priority,
            status: pqrs.status,
            slaDueAt: pqrs.slaDueAt,
            subject: pqrs.subject,
          },
          null,
        ),
      ),
    ),
  );

  return NextResponse.json({ processed: pendings.length });
}
