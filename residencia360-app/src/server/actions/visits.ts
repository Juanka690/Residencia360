"use server";

import { VisitStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";

const visitSchema = z.object({
  fullName: z.string().min(3),
  document: z.string().min(5),
  phone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  reason: z.string().min(4),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  gateType: z.enum(["PEDESTRIAN", "VEHICULAR"]),
  apartmentId: z.string().min(1),
  residentId: z.string().min(1),
});

export async function createVisitAction(input: z.infer<typeof visitSchema>, actorId: string) {
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de visita invalidos." };
  }

  const start = new Date(parsed.data.scheduledStart);
  const end = new Date(parsed.data.scheduledEnd);

  if (end <= start) {
    return { success: false, message: "La salida debe ser posterior al ingreso." };
  }

  const visitor = await db.visitor.upsert({
    where: {
      document_fullName: {
        document: parsed.data.document,
        fullName: parsed.data.fullName,
      },
    },
    create: {
      fullName: parsed.data.fullName,
      document: parsed.data.document,
      phone: parsed.data.phone,
      vehiclePlate: parsed.data.vehiclePlate,
    },
    update: {
      phone: parsed.data.phone,
      vehiclePlate: parsed.data.vehiclePlate,
    },
  });

  const count = await db.visit.count();
  const code = `VIS-${String(count + 1).padStart(4, "0")}`;

  const visit = await db.visit.create({
    data: {
      code,
      qrToken: `QR-${code}`,
      visitorId: visitor.id,
      residentId: parsed.data.residentId,
      apartmentId: parsed.data.apartmentId,
      createdById: actorId,
      reason: parsed.data.reason,
      scheduledStart: start,
      scheduledEnd: end,
      gateType: parsed.data.gateType,
      status: VisitStatus.PRE_REGISTERED,
    },
  });

  await writeAuditLog({
    actorId,
    action: "VISIT_CREATED",
    entityType: "Visit",
    entityId: visit.id,
    detail: `Visita ${code} creada.`,
  });

  revalidatePath("/visitors");
  revalidatePath("/dashboard/resident");
  return { success: true, message: "Visita pre-registrada.", visitId: visit.id };
}

export async function updateVisitStatusAction(visitId: string, status: VisitStatus, actorId: string) {
  const visit = await db.visit.findUnique({ where: { id: visitId } });
  if (!visit) {
    return { success: false, message: "Visita no encontrada." };
  }

  const data =
    status === VisitStatus.APPROVED
      ? { status, approvedAt: new Date(), approvedById: actorId }
      : { status };

  await db.visit.update({
    where: { id: visitId },
    data,
  });

  await writeAuditLog({
    actorId,
    action: `VISIT_${status}`,
    entityType: "Visit",
    entityId: visitId,
    detail: `Visita ${visit.code} actualizada a ${status}.`,
  });

  revalidatePath("/visitors");
  revalidatePath("/gate");
  return { success: true, message: "Estado actualizado." };
}

export async function registerVisitIngressAction(visitId: string, guardId: string) {
  const visit = await db.visit.findUnique({ where: { id: visitId } });
  if (!visit) {
    return { success: false, message: "Visita no encontrada." };
  }

  const now = new Date();
  const startWindow = new Date(visit.scheduledStart.getTime() - 1000 * 60 * 60);
  const endWindow = new Date(visit.scheduledEnd.getTime() + 1000 * 60 * 60);

  if (visit.status !== VisitStatus.APPROVED) {
    return { success: false, message: "Solo se permite ingreso para visitas aprobadas." };
  }

  if (now < startWindow || now > endWindow) {
    return { success: false, message: "La visita esta fuera de la ventana autorizada." };
  }

  await db.visit.update({
    where: { id: visitId },
    data: {
      status: VisitStatus.CHECKED_IN,
      checkedInAt: now,
      guardInId: guardId,
    },
  });

  await writeAuditLog({
    actorId: guardId,
    action: "VISIT_CHECKED_IN",
    entityType: "Visit",
    entityId: visitId,
    detail: `Ingreso registrado para ${visit.code}.`,
  });

  revalidatePath("/gate");
  revalidatePath("/visitors");
  return { success: true, message: "Ingreso registrado." };
}

export async function registerVisitEgressAction(visitId: string, guardId: string) {
  const visit = await db.visit.findUnique({ where: { id: visitId } });
  if (!visit || visit.status !== VisitStatus.CHECKED_IN) {
    return { success: false, message: "La visita no esta en curso." };
  }

  await db.visit.update({
    where: { id: visitId },
    data: {
      status: VisitStatus.COMPLETED,
      checkedOutAt: new Date(),
      guardOutId: guardId,
    },
  });

  await writeAuditLog({
    actorId: guardId,
    action: "VISIT_CHECKED_OUT",
    entityType: "Visit",
    entityId: visitId,
    detail: `Salida registrada para ${visit.code}.`,
  });

  revalidatePath("/gate");
  revalidatePath("/visitors");
  return { success: true, message: "Salida registrada." };
}
