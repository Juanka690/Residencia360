import { PqrsPriority } from "@prisma/client";

/**
 * Patron Strategy (Entregable 2 §4.1, RN-09).
 * Encapsula el calculo del vencimiento del SLA segun la prioridad.
 */
export interface IPoliticaSLA {
  readonly id: string;
  readonly horas: number;
  calcularVencimiento(creacion: Date): Date;
  descripcion(): string;
}

class PoliticaSLABase implements IPoliticaSLA {
  constructor(
    readonly id: string,
    readonly horas: number,
    private readonly label: string,
  ) {}

  calcularVencimiento(creacion: Date): Date {
    return new Date(creacion.getTime() + this.horas * 60 * 60 * 1000);
  }

  descripcion(): string {
    return this.label;
  }
}

export const SlaCritica = new PoliticaSLABase("SLA_CRITICA", 4, "Critica: 4 horas");
export const SlaAlta = new PoliticaSLABase("SLA_ALTA", 24, "Alta: 24 horas");
export const SlaMedia = new PoliticaSLABase("SLA_MEDIA", 72, "Media: 72 horas");
export const SlaBaja = new PoliticaSLABase("SLA_BAJA", 168, "Baja: 7 dias");

const politicas = new Map<PqrsPriority, IPoliticaSLA>([
  [PqrsPriority.CRITICAL, SlaCritica],
  [PqrsPriority.HIGH, SlaAlta],
  [PqrsPriority.MEDIUM, SlaMedia],
  [PqrsPriority.LOW, SlaBaja],
]);

export function obtenerPoliticaSLA(priority: PqrsPriority): IPoliticaSLA {
  const politica = politicas.get(priority);
  if (!politica) {
    throw new Error(`No existe politica SLA para la prioridad ${priority}`);
  }
  return politica;
}

export function calcularVencimientoSLA(priority: PqrsPriority, creacion = new Date()): Date {
  return obtenerPoliticaSLA(priority).calcularVencimiento(creacion);
}
