import type { CommonArea, LedgerAccount, MaintenanceBlock, Reservation } from "@prisma/client";

import { ReglaReservaViolada } from "@/server/domain/errors/domain-errors";

/**
 * Patron Strategy (Entregable 2 §4.1, RN-06/07/08).
 * Cada regla valida una condicion atomica de una solicitud de reserva.
 */
export type SolicitudReserva = {
  areaId: string;
  apartmentId: string;
  startAt: Date;
  endAt: Date;
  attendees: number;
};

export type ContextoReserva = {
  area: CommonArea;
  account: LedgerAccount | null;
  reservationsOverlap: Pick<Reservation, "id" | "startAt" | "endAt" | "status">[];
  maintenanceOverlap: Pick<MaintenanceBlock, "id" | "startAt" | "endAt" | "reason">[];
  reservationsLastWeek: number;
  now: Date;
};

export type ResultadoRegla = { ok: true } | { ok: false; motivo: string };

export interface IReglaReserva {
  readonly id: string;
  validar(solicitud: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla;
}

class RegSinMora implements IReglaReserva {
  readonly id = "RN-08";
  validar(_: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla {
    if (contexto.area.blockIfInArrears && contexto.account?.status === "IN_ARREARS") {
      return { ok: false, motivo: "El apartamento esta en mora y no puede reservar (RN-08)." };
    }
    return { ok: true };
  }
}

class RegAnticipacion implements IReglaReserva {
  readonly id = "RN-06";
  validar(s: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla {
    const horasAnticipacion = (s.startAt.getTime() - contexto.now.getTime()) / (1000 * 60 * 60);
    if (horasAnticipacion < contexto.area.minimumAdvanceHours) {
      return {
        ok: false,
        motivo: `Se requieren al menos ${contexto.area.minimumAdvanceHours} horas de anticipacion (RN-06).`,
      };
    }
    return { ok: true };
  }
}

class RegSinSolapamiento implements IReglaReserva {
  readonly id = "RES-DISPONIBILIDAD";
  validar(_: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla {
    if (contexto.reservationsOverlap.length > 0) {
      return { ok: false, motivo: "Ya existe una reserva en la franja seleccionada." };
    }
    return { ok: true };
  }
}

class RegSinBloqueoMantenimiento implements IReglaReserva {
  readonly id = "RES-MANTENIMIENTO";
  validar(_: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla {
    if (contexto.maintenanceOverlap.length > 0) {
      return {
        ok: false,
        motivo: `La franja esta bloqueada por mantenimiento: ${contexto.maintenanceOverlap[0].reason}.`,
      };
    }
    return { ok: true };
  }
}

class RegMaxSemanal implements IReglaReserva {
  readonly id = "RN-07";
  validar(_: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla {
    if (contexto.reservationsLastWeek >= contexto.area.maxActiveReservationsWeekly) {
      return {
        ok: false,
        motivo: `Se alcanzo el maximo semanal de ${contexto.area.maxActiveReservationsWeekly} reservas (RN-07).`,
      };
    }
    return { ok: true };
  }
}

class RegFechaCoherente implements IReglaReserva {
  readonly id = "RES-FECHAS";
  validar(s: SolicitudReserva): ResultadoRegla {
    if (s.endAt <= s.startAt) {
      return { ok: false, motivo: "La hora de finalizacion debe ser posterior a la de inicio." };
    }
    return { ok: true };
  }
}

class RegCapacidad implements IReglaReserva {
  readonly id = "RES-CAPACIDAD";
  validar(s: SolicitudReserva, contexto: ContextoReserva): ResultadoRegla {
    if (s.attendees > contexto.area.capacity) {
      return {
        ok: false,
        motivo: `La capacidad maxima de la zona es ${contexto.area.capacity} personas.`,
      };
    }
    return { ok: true };
  }
}

export const reglasReservaPorDefecto: IReglaReserva[] = [
  new RegFechaCoherente(),
  new RegSinMora(),
  new RegCapacidad(),
  new RegAnticipacion(),
  new RegSinSolapamiento(),
  new RegSinBloqueoMantenimiento(),
  new RegMaxSemanal(),
];

export class ReservationValidator {
  constructor(private readonly reglas: IReglaReserva[] = reglasReservaPorDefecto) {}

  validar(solicitud: SolicitudReserva, contexto: ContextoReserva): void {
    for (const regla of this.reglas) {
      const resultado = regla.validar(solicitud, contexto);
      if (!resultado.ok) {
        throw new ReglaReservaViolada(resultado.motivo, regla.id);
      }
    }
  }
}
