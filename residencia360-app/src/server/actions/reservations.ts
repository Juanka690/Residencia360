"use server";

import { ReservationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";

const reservationSchema = z.object({
  areaId: z.string().min(1),
  apartmentId: z.string().min(1),
  startAt: z.string(),
  endAt: z.string(),
  attendees: z.coerce.number().min(1),
  purpose: z.string().min(6),
});

export async function createReservationAction(input: z.infer<typeof reservationSchema>, residentId: string) {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de reserva invalidos." };
  }

  const area = await db.commonArea.findUnique({ where: { id: parsed.data.areaId } });
  if (!area) {
    return { success: false, message: "Zona comun no encontrada." };
  }

  const account = await db.ledgerAccount.findUnique({
    where: { apartmentId: parsed.data.apartmentId },
  });

  if (area.blockIfInArrears && account?.status === "IN_ARREARS") {
    return { success: false, message: "No puedes reservar mientras el apartamento este en mora." };
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  const hoursDiff = (startAt.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursDiff < area.minimumAdvanceHours) {
    return { success: false, message: `Debes reservar con al menos ${area.minimumAdvanceHours} horas de anticipacion.` };
  }

  const overlap = await db.reservation.findFirst({
    where: {
      areaId: area.id,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (overlap) {
    return { success: false, message: "Ya existe una reserva en esa franja horaria." };
  }

  const maintenance = await db.maintenanceBlock.findFirst({
    where: {
      areaId: area.id,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });

  if (maintenance) {
    return { success: false, message: "La fecha esta bloqueada por mantenimiento." };
  }

  const weekCount = await db.reservation.count({
    where: {
      apartmentId: parsed.data.apartmentId,
      status: { in: [ReservationStatus.PENDING, ReservationStatus.APPROVED] },
      startAt: { gte: new Date(new Date(startAt).setDate(startAt.getDate() - 7)) },
    },
  });

  if (weekCount >= area.maxActiveReservationsWeekly) {
    return { success: false, message: "Se alcanzo el maximo de reservas activas por semana." };
  }

  await db.reservation.create({
    data: {
      ...parsed.data,
      residentId,
      startAt,
      endAt,
    },
  });

  await writeAuditLog({
    actorId: residentId,
    action: "RESERVATION_CREATED",
    entityType: "Reservation",
    detail: `Reserva creada para ${area.name}.`,
  });

  revalidatePath("/reservations");
  return { success: true, message: "Reserva creada." };
}

export async function reviewReservationAction(
  reservationId: string,
  actorId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
) {
  await db.reservation.update({
    where: { id: reservationId },
    data: {
      status,
      approvedById: actorId,
      approvedAt: new Date(),
      rejectionReason: status === ReservationStatus.REJECTED ? rejectionReason : null,
    },
  });

  await writeAuditLog({
    actorId,
    action: "RESERVATION_REVIEWED",
    entityType: "Reservation",
    entityId: reservationId,
    detail: `Reserva ${status}.`,
  });

  revalidatePath("/reservations");
  return { success: true, message: "Reserva actualizada." };
}
