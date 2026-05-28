"use server";

import { ReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";
import { fromDomainError, EntidadNoEncontrada, type ActionResult } from "@/server/domain/errors/domain-errors";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";
import { ReservationValidator } from "@/server/domain/policies/reservation-rules";
import { reservationRepo } from "@/server/repositories/prisma/reservation-repo";

const reservationSchema = z.object({
  areaId: z.string().min(1),
  apartmentId: z.string().min(1),
  startAt: z.string(),
  endAt: z.string(),
  attendees: z.coerce.number().min(1),
  purpose: z.string().min(6),
});

const validator = new ReservationValidator();

export async function createReservationAction(
  input: z.infer<typeof reservationSchema>,
  residentId: string,
): Promise<ActionResult<{ reservationId: string }>> {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de reserva invalidos." };
  }

  try {
    const startAt = new Date(parsed.data.startAt);
    const endAt = new Date(parsed.data.endAt);
    const now = new Date();
    const sinceWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const area = await reservationRepo.findArea(parsed.data.areaId);
    if (!area) throw new EntidadNoEncontrada("Zona comun");

    const account = await reservationRepo.findAccount(parsed.data.apartmentId);
    const reservationsOverlap = await reservationRepo.findOverlaps(area.id, startAt, endAt);
    const maintenanceOverlap = await reservationRepo.findMaintenanceOverlaps(area.id, startAt, endAt);
    const reservationsLastWeek = await reservationRepo.countWeekly(parsed.data.apartmentId, sinceWeek);

    validator.validar(
      {
        areaId: area.id,
        apartmentId: parsed.data.apartmentId,
        startAt,
        endAt,
        attendees: parsed.data.attendees,
      },
      {
        area,
        account,
        reservationsOverlap,
        maintenanceOverlap,
        reservationsLastWeek,
        now,
      },
    );

    const reservation = await db.reservation.create({
      data: {
        areaId: area.id,
        apartmentId: parsed.data.apartmentId,
        residentId,
        startAt,
        endAt,
        attendees: parsed.data.attendees,
        purpose: parsed.data.purpose,
        status: ReservationStatus.PENDING,
      },
    });

    await writeAuditLog({
      actorId: residentId,
      action: "RESERVATION_CREATED",
      entityType: "Reservation",
      entityId: reservation.id,
      detail: `Reserva creada para ${area.name}.`,
    });

    await eventBus.publish(
      buildEvent(
        "ReservaCreada",
        {
          reservationId: reservation.id,
          areaName: area.name,
          residentId,
          startAt,
          endAt,
          status: reservation.status,
        },
        residentId,
      ),
    );

    revalidatePath("/reservations");
    return { success: true, message: "Reserva creada.", data: { reservationId: reservation.id } };
  } catch (err) {
    return fromDomainError(err, "No se pudo crear la reserva.");
  }
}

export async function reviewReservationAction(
  reservationId: string,
  actorId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
): Promise<ActionResult> {
  try {
    const updated = await db.reservation.update({
      where: { id: reservationId },
      data: {
        status,
        approvedById: actorId,
        approvedAt: new Date(),
        rejectionReason: status === ReservationStatus.REJECTED ? rejectionReason : null,
      },
      include: { area: true },
    });

    await writeAuditLog({
      actorId,
      action: "RESERVATION_REVIEWED",
      entityType: "Reservation",
      entityId: reservationId,
      detail: `Reserva ${status}.`,
    });

    await eventBus.publish(
      buildEvent(
        status === "APPROVED" ? "ReservaAprobada" : "ReservaRechazada",
        {
          reservationId: updated.id,
          areaName: updated.area.name,
          residentId: updated.residentId,
          startAt: updated.startAt,
          endAt: updated.endAt,
          status: updated.status,
        },
        actorId,
      ),
    );

    revalidatePath("/reservations");
    return { success: true, message: "Reserva actualizada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo actualizar la reserva.");
  }
}
