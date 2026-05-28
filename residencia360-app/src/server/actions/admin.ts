"use server";

import { ParkingSpotType, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import "@/server/bootstrap";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/server/actions/helpers";
import { fromDomainError, type ActionResult } from "@/server/domain/errors/domain-errors";
import { buildEvent } from "@/server/domain/events/domain-events";
import { eventBus } from "@/server/domain/events/event-bus";
import { requireRole } from "@/server/auth/session";

// =============== USERS ===============

const userSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  towerId: z.string().optional().nullable(),
  apartmentId: z.string().optional().nullable(),
});

export async function createUserAction(input: z.infer<typeof userSchema>): Promise<ActionResult<{ userId: string; resetToken: string | null }>> {
  await requireRole([Role.ADMIN]);
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos de usuario invalidos." };
  try {
    const tempPassword = randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const user = await db.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || null,
        document: parsed.data.document || null,
        role: parsed.data.role,
        status: parsed.data.status,
        towerId: parsed.data.towerId || null,
        apartmentId: parsed.data.apartmentId || null,
        passwordHash,
      },
    });

    let resetToken: string | null = null;
    if (parsed.data.status === UserStatus.INVITED) {
      resetToken = randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db.passwordResetToken.create({
        data: { userId: user.id, token: resetToken, expiresAt },
      });
      await eventBus.publish(
        buildEvent(
          "PasswordResetSolicitado",
          { userId: user.id, email: user.email, token: resetToken, expiresAt },
          user.id,
        ),
      );
    }

    await writeAuditLog({
      action: "USER_CREATED",
      entityType: "User",
      entityId: user.id,
      detail: `Usuario creado con rol ${user.role}.`,
    });

    revalidatePath("/admin/users");
    return { success: true, message: "Usuario creado.", data: { userId: user.id, resetToken } };
  } catch (err) {
    return fromDomainError(err, "No se pudo crear el usuario.");
  }
}

const userUpdateSchema = userSchema.partial().extend({ id: z.string().min(1) });

export async function updateUserAction(input: z.infer<typeof userUpdateSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };

  const { id, ...rest } = parsed.data;
  await db.user.update({
    where: { id },
    data: {
      ...rest,
      email: rest.email ? rest.email.toLowerCase() : undefined,
      towerId: rest.towerId ?? undefined,
      apartmentId: rest.apartmentId ?? undefined,
    },
  });

  await writeAuditLog({
    action: "USER_UPDATED",
    entityType: "User",
    entityId: id,
    detail: "Usuario actualizado por administracion.",
  });

  revalidatePath("/admin/users");
  return { success: true, message: "Usuario actualizado." };
}

export async function setUserStatusAction(userId: string, status: UserStatus): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  await db.user.update({ where: { id: userId }, data: { status } });
  await writeAuditLog({
    action: `USER_${status}`,
    entityType: "User",
    entityId: userId,
    detail: `Usuario marcado como ${status}.`,
  });
  revalidatePath("/admin/users");
  return { success: true, message: "Estado actualizado." };
}

// =============== TOWERS ===============

const towerSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(1).max(8),
});

export async function createTowerAction(input: z.infer<typeof towerSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = towerSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  try {
    await db.tower.create({ data: parsed.data });
    await writeAuditLog({ action: "TOWER_CREATED", entityType: "Tower", detail: `Torre ${parsed.data.name}.` });
    revalidatePath("/admin/towers");
    return { success: true, message: "Torre creada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo crear la torre.");
  }
}

export async function updateTowerAction(id: string, input: z.infer<typeof towerSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = towerSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.tower.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/towers");
  return { success: true, message: "Torre actualizada." };
}

export async function deleteTowerAction(id: string): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  try {
    await db.tower.delete({ where: { id } });
    revalidatePath("/admin/towers");
    return { success: true, message: "Torre eliminada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo eliminar (verifica que no tenga unidades asociadas).");
  }
}

// =============== UNITS ===============

const unitSchema = z.object({
  towerId: z.string().min(1),
  number: z.string().min(1),
  floor: z.coerce.number().min(1),
  apartmentCode: z.string().min(1),
});

export async function createUnitAction(input: z.infer<typeof unitSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = unitSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  try {
    await db.residentialUnit.create({ data: parsed.data });
    revalidatePath("/admin/units");
    return { success: true, message: "Unidad creada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo crear la unidad.");
  }
}

export async function updateUnitAction(id: string, input: z.infer<typeof unitSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = unitSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.residentialUnit.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/units");
  return { success: true, message: "Unidad actualizada." };
}

export async function deleteUnitAction(id: string): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  try {
    await db.residentialUnit.delete({ where: { id } });
    revalidatePath("/admin/units");
    return { success: true, message: "Unidad eliminada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo eliminar.");
  }
}

// =============== COMMON AREAS ===============

const areaSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(4),
  capacity: z.coerce.number().min(1),
  color: z.string().default("#1d4ed8"),
  minimumAdvanceHours: z.coerce.number().min(0).default(24),
  maxActiveReservationsWeekly: z.coerce.number().min(1).default(1),
  blockIfInArrears: z.coerce.boolean().default(true),
});

export async function createCommonAreaAction(input: z.infer<typeof areaSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = areaSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  try {
    await db.commonArea.create({ data: parsed.data });
    revalidatePath("/admin/common-areas");
    return { success: true, message: "Zona comun creada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo crear la zona.");
  }
}

export async function updateCommonAreaAction(id: string, input: z.infer<typeof areaSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = areaSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.commonArea.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/common-areas");
  return { success: true, message: "Zona comun actualizada." };
}

export async function deleteCommonAreaAction(id: string): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  try {
    await db.commonArea.delete({ where: { id } });
    revalidatePath("/admin/common-areas");
    return { success: true, message: "Zona eliminada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo eliminar (verifica reservas asociadas).");
  }
}

// =============== MAINTENANCE BLOCKS ===============

const blockSchema = z.object({
  areaId: z.string().min(1),
  startAt: z.string(),
  endAt: z.string(),
  reason: z.string().min(4),
});

export async function createMaintenanceBlockAction(input: z.infer<typeof blockSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  const startAt = new Date(parsed.data.startAt);
  const endAt = new Date(parsed.data.endAt);
  if (endAt <= startAt) return { success: false, message: "La hora final debe ser posterior." };
  await db.maintenanceBlock.create({
    data: { areaId: parsed.data.areaId, startAt, endAt, reason: parsed.data.reason },
  });
  revalidatePath("/admin/maintenance-blocks");
  return { success: true, message: "Bloqueo creado." };
}

export async function deleteMaintenanceBlockAction(id: string): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  await db.maintenanceBlock.delete({ where: { id } });
  revalidatePath("/admin/maintenance-blocks");
  return { success: true, message: "Bloqueo eliminado." };
}

// =============== PROVIDER COMPANIES ===============

const providerCompanySchema = z.object({
  name: z.string().min(2),
  taxId: z.string().optional().nullable(),
  contactName: z.string().min(2),
  contactPhone: z.string().min(7),
  contactEmail: z.string().email().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

export async function createProviderCompanyAction(input: z.infer<typeof providerCompanySchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = providerCompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.providerCompany.create({
    data: {
      ...parsed.data,
      taxId: parsed.data.taxId || null,
      contactEmail: parsed.data.contactEmail || null,
    },
  });
  revalidatePath("/admin/providers");
  return { success: true, message: "Empresa creada." };
}

export async function updateProviderCompanyAction(id: string, input: z.infer<typeof providerCompanySchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = providerCompanySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.providerCompany.update({
    where: { id },
    data: {
      ...parsed.data,
      taxId: parsed.data.taxId || null,
      contactEmail: parsed.data.contactEmail || null,
    },
  });
  revalidatePath("/admin/providers");
  return { success: true, message: "Empresa actualizada." };
}

export async function deleteProviderCompanyAction(id: string): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  try {
    await db.providerCompany.delete({ where: { id } });
    revalidatePath("/admin/providers");
    return { success: true, message: "Empresa eliminada." };
  } catch (err) {
    return fromDomainError(err, "No se pudo eliminar (revisa accesos asociados).");
  }
}

// =============== PARKING SPOTS ===============

const parkingSpotSchema = z.object({
  label: z.string().min(1),
  type: z.nativeEnum(ParkingSpotType).default(ParkingSpotType.VISITOR),
  isActive: z.coerce.boolean().default(true),
});

export async function createParkingSpotAction(input: z.infer<typeof parkingSpotSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = parkingSpotSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.parkingSpot.create({ data: parsed.data });
  revalidatePath("/admin/parking-spots");
  return { success: true, message: "Cupo creado." };
}

export async function updateParkingSpotAction(id: string, input: z.infer<typeof parkingSpotSchema>): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  const parsed = parkingSpotSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Datos invalidos." };
  await db.parkingSpot.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/parking-spots");
  return { success: true, message: "Cupo actualizado." };
}

export async function deleteParkingSpotAction(id: string): Promise<ActionResult> {
  await requireRole([Role.ADMIN]);
  try {
    await db.parkingSpot.delete({ where: { id } });
    revalidatePath("/admin/parking-spots");
    return { success: true, message: "Cupo eliminado." };
  } catch (err) {
    return fromDomainError(err, "No se pudo eliminar.");
  }
}
