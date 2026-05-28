import type { CommonArea, LedgerAccount, MaintenanceBlock, Reservation } from "@prisma/client";

export interface IReservationRepo {
  findArea(areaId: string): Promise<CommonArea | null>;
  findAccount(apartmentId: string): Promise<LedgerAccount | null>;
  findOverlaps(areaId: string, startAt: Date, endAt: Date): Promise<Pick<Reservation, "id" | "startAt" | "endAt" | "status">[]>;
  findMaintenanceOverlaps(areaId: string, startAt: Date, endAt: Date): Promise<Pick<MaintenanceBlock, "id" | "startAt" | "endAt" | "reason">[]>;
  countWeekly(apartmentId: string, since: Date): Promise<number>;
}
