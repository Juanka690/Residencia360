"use server";

import { PaymentStatus, ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";

const paymentSchema = z.object({
  apartmentId: z.string().min(1),
  reference: z.string().min(4),
  amount: z.coerce.number().min(1),
  paidAt: z.string(),
  fileName: z.string().min(3),
  notes: z.string().optional(),
});

export async function submitPaymentSupportAction(input: z.infer<typeof paymentSchema>, actorId: string) {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Datos de pago invalidos." };
  }

  const account = await db.ledgerAccount.findUnique({
    where: { apartmentId: parsed.data.apartmentId },
  });

  if (!account) {
    return { success: false, message: "Estado de cuenta no encontrado." };
  }

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
          fileUrl: `/uploads/mock/${parsed.data.fileName}`,
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

  revalidatePath("/accounting");
  return { success: true, message: "Soporte de pago enviado." };
}

export async function reviewPaymentSupportAction(
  paymentId: string,
  actorId: string,
  supportStatus: "APPROVED" | "REJECTED",
  paymentStatus: "APPLIED" | "REJECTED",
  feedback?: string,
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { supports: true, ledgerAccount: true },
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
      data: {
        balance: Math.max(payment.ledgerAccount.balance - payment.amount, 0),
      },
    });
  }

  await writeAuditLog({
    actorId,
    action: "PAYMENT_REVIEWED",
    entityType: "Payment",
    entityId: paymentId,
    detail: `Pago ${payment.reference} revisado con resultado ${paymentStatus}.`,
  });

  revalidatePath("/accounting");
  return { success: true, message: "Pago actualizado." };
}
