import { Role } from "@prisma/client";

import { db } from "@/lib/db";

export async function getAccountingView(role: Role, apartmentId?: string | null) {
  if (role === Role.RESIDENT && apartmentId) {
    return db.ledgerAccount.findUnique({
      where: { apartmentId },
      select: {
        id: true,
        balance: true,
        dueAmount: true,
        overdueAmount: true,
        charges: {
          select: {
            id: true,
            concept: true,
            periodLabel: true,
            amount: true,
            dueDate: true,
          },
          orderBy: { dueDate: "desc" },
        },
        payments: {
          select: {
            id: true,
            reference: true,
            amount: true,
            paidAt: true,
            supports: {
              select: {
                id: true,
                fileName: true,
                status: true,
              },
            },
          },
          orderBy: { paidAt: "desc" },
        },
      },
    });
  }

  return db.ledgerAccount.findMany({
    take: 40,
    where: {
      payments: {
        some: {
          status: "SUBMITTED",
        },
      },
    },
    select: {
      id: true,
      balance: true,
      overdueAmount: true,
      status: true,
      apartment: {
        select: {
          number: true,
          tower: {
            select: {
              name: true,
            },
          },
        },
      },
      payments: {
        where: {
          status: "SUBMITTED",
        },
        select: {
          id: true,
          reference: true,
          amount: true,
          paidAt: true,
          supports: {
            select: {
              id: true,
              status: true,
              fileName: true,
            },
          },
        },
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: [{ status: "desc" }, { overdueAmount: "desc" }],
  });
}
