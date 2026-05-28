"use server";

import { PaymentStatus, ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";
import { fromDomainError, type ActionResult } from "@/server/domain/errors/domain-errors";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";

const paymentSchema = z.object({
  apartmentId: z.string().min(1),
  reference: z.string().min(4),
  amount: z.coerce.number().min(1),
  paidAt: z.string(),
  fileName: z.string().min(3),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
});

async function residentIdsForApartment(apartmentId: string): Promise<string[]> {
  const residents = await db.user.findMany({
    where: { apartmentId, role: "RESIDENT", status: "ACTIVE" },
    select: { id: true },
  });
  return residents.map((r) => r.id);
}

export async function submitPaymentSupportAction(
  input: z.infer<typeof paymentSchema>,
  actorId: string,
): Promise<ActionResult<{ paymentId: string }>> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de pago invalidos." };
  }

  try {
    const account = await db.ledgerAccount.findUnique({
      where: { apartmentId: parsed.data.apartmentId },
    });
    if (!account) return { success: false, message: "Estado de cuenta no encontrado." };

    const fileUrl = parsed.data.fileUrl ?? `/uploads/mock/${parsed.data.fileName}`;

    const payment = await db.payment.create({
      data: {
        ledgerAccountId: account.id,
        reference: parsed.data.reference,
        amount: parsed.data.amount,
        paidAt: new Date(parsed.data.paidAt),
        status: PaymentStatus.SUBMITTED,
        createdById: actorId,
        notes: parsed.data.notes,
        supports: {
          create: {
            fileName: parsed.data.fileName,
            fileUrl,
            status: ReviewStatus.PENDING,
          },
        },
      },
    });

    await writeAuditLog({
      actorId,
      action: "PAYMENT_SUBMITTED",
      entityType: "Payment",
      entityId: payment.id,
      detail: `Pago ${payment.reference} enviado para validacion.`,
    });

    await eventBus.publish(
      buildEvent(
        "PagoEnviado",
        {
          paymentId: payment.id,
          reference: payment.reference,
          ledgerAccountId: account.id,
          apartmentId: parsed.data.apartmentId,
          residentIds: await residentIdsForApartment(parsed.data.apartmentId),
          amount: payment.amount,
          status: payment.status,
        },
        actorId,
      ),
    );

    revalidatePath("/accounting");
    return { success: true, message: "Soporte de pago enviado.", data: { paymentId: payment.id } };
  } catch (err) {
    return fromDomainError(err, "No se pudo enviar el soporte de pago.");
  }
}

export async function reviewPaymentSupportAction(
  paymentId: string,
  actorId: string,
  supportStatus: "APPROVED" | "REJECTED",
  paymentStatus: "APPLIED" | "REJECTED",
  feedback?: string,
): Promise<ActionResult> {
  try {
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: { supports: true, ledgerAccount: { include: { apartment: true } } },
    });

    if (!payment || !payment.supports[0]) {
      return { success: false, message: "Pago no encontrado." };
    }

    await db.payment.update({
      where: { id: paymentId },
      data: {
        status: paymentStatus,
        validatedById: actorId,
        validatedAt: new Date(),
      },
    });

    await db.paymentSupport.update({
      where: { id: payment.supports[0].id },
      data: {
        status: supportStatus,
        reviewedById: actorId,
        reviewedAt: new Date(),
        feedback,
      },
    });

    if (paymentStatus === PaymentStatus.APPLIED) {
      await db.ledgerAccount.update({
        where: { id: payment.ledgerAccountId },
        data: { balance: Math.max(payment.ledgerAccount.balance - payment.amount, 0) },
      });
    }

    await writeAuditLog({
      actorId,
      action: "PAYMENT_REVIEWED",
      entityType: "Payment",
      entityId: paymentId,
      detail: `Pago ${payment.reference} revisado con resultado ${paymentStatus}.`,
    });

    await eventBus.publish(
      buildEvent(
        paymentStatus === "APPLIED" ? "PagoAprobado" : "PagoRechazado",
        {
          paymentId,
          reference: payment.reference,
          ledgerAccountId: payment.ledgerAccountId,
          apartmentId: payment.ledgerAccount.apartmentId,
          residentIds: await residentIdsForApartment(payment.ledgerAccount.apartmentId),
          amount: payment.amount,
          status: paymentStatus,
        },
        actorId,
      ),
    );

    revalidatePath("/accounting");
    return { success: true, message: "Pago actualizado." };
  } catch (err) {
    return fromDomainError(err, "No se pudo revisar el pago.");
  }
}
