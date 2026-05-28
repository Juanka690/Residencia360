import { VisitStatus } from "@prisma/client";

import { IngresoDenegado, TransicionIlegal } from "@/server/domain/errors/domain-errors";

/**
 * Patron State (Entregable 2 §4.3, RN-02/03; Entregable 3 §3.1).
 * Cada estado encapsula las transiciones legales del ciclo de vida de la visita.
 */
export type VisitContext = {
  status: VisitStatus;
  scheduledStart: Date;
  scheduledEnd: Date;
  qrToken: string;
  /** Margen de la ventana de ingreso (±2h por RN-03) */
  ventanaMs?: number;
};

export type TransicionResultado = {
  nuevoEstado: VisitStatus;
  campos?: Partial<{
    approvedAt: Date;
    approvedById: string;
    checkedInAt: Date;
    guardInId: string;
    checkedOutAt: Date;
    guardOutId: string;
  }>;
};

export interface EstadoVisita {
  readonly nombre: VisitStatus;
  aprobar(_: VisitContext, actorId: string): TransicionResultado;
  rechazar(_: VisitContext): TransicionResultado;
  cancelar(_: VisitContext): TransicionResultado;
  validarIngreso(_: VisitContext, guardId: string, now?: Date): TransicionResultado;
  registrarSalida(_: VisitContext, guardId: string, now?: Date): TransicionResultado;
}

abstract class EstadoBase implements EstadoVisita {
  abstract readonly nombre: VisitStatus;

  aprobar(_: VisitContext, _actorId: string): TransicionResultado {
    void _; void _actorId;
    throw new TransicionIlegal(`No se puede aprobar una visita en estado ${this.nombre}.`);
  }
  rechazar(_: VisitContext): TransicionResultado {
    void _;
    throw new TransicionIlegal(`No se puede rechazar una visita en estado ${this.nombre}.`);
  }
  cancelar(_: VisitContext): TransicionResultado {
    void _;
    throw new TransicionIlegal(`No se puede cancelar una visita en estado ${this.nombre}.`);
  }
  validarIngreso(_: VisitContext, _guardId: string, _now?: Date): TransicionResultado {
    void _; void _guardId; void _now;
    throw new TransicionIlegal(`No se permite ingreso para una visita en estado ${this.nombre}.`);
  }
  registrarSalida(_: VisitContext, _guardId: string, _now?: Date): TransicionResultado {
    void _; void _guardId; void _now;
    throw new TransicionIlegal(`No se permite salida para una visita en estado ${this.nombre}.`);
  }
}

const VENTANA_DEFECTO_MS = 2 * 60 * 60 * 1000;

class EstadoPreRegistrada extends EstadoBase {
  readonly nombre = VisitStatus.PRE_REGISTERED;
  override aprobar(_: VisitContext, actorId: string): TransicionResultado {
    return {
      nuevoEstado: VisitStatus.APPROVED,
      campos: { approvedAt: new Date(), approvedById: actorId },
    };
  }
  override rechazar(): TransicionResultado {
    return { nuevoEstado: VisitStatus.REJECTED };
  }
  override cancelar(): TransicionResultado {
    return { nuevoEstado: VisitStatus.CANCELLED };
  }
}

class EstadoAprobada extends EstadoBase {
  readonly nombre = VisitStatus.APPROVED;
  override cancelar(): TransicionResultado {
    return { nuevoEstado: VisitStatus.CANCELLED };
  }
  override validarIngreso(ctx: VisitContext, guardId: string, now = new Date()): TransicionResultado {
    const margen = ctx.ventanaMs ?? VENTANA_DEFECTO_MS;
    const inicio = new Date(ctx.scheduledStart.getTime() - margen);
    const fin = new Date(ctx.scheduledEnd.getTime() + margen);

    if (now < inicio || now > fin) {
      throw new IngresoDenegado(
        "La visita esta fuera de la ventana horaria autorizada (RN-03).",
        "ventana",
      );
    }
    return {
      nuevoEstado: VisitStatus.CHECKED_IN,
      campos: { checkedInAt: now, guardInId: guardId },
    };
  }
}

class EstadoIngresada extends EstadoBase {
  readonly nombre = VisitStatus.CHECKED_IN;
  override registrarSalida(_: VisitContext, guardId: string, now = new Date()): TransicionResultado {
    return {
      nuevoEstado: VisitStatus.COMPLETED,
      campos: { checkedOutAt: now, guardOutId: guardId },
    };
  }
}

class EstadoFinalizada extends EstadoBase {
  readonly nombre = VisitStatus.COMPLETED;
}
class EstadoCancelada extends EstadoBase {
  readonly nombre = VisitStatus.CANCELLED;
}
class EstadoRechazada extends EstadoBase {
  readonly nombre = VisitStatus.REJECTED;
}

const estados = new Map<VisitStatus, EstadoVisita>([
  [VisitStatus.PRE_REGISTERED, new EstadoPreRegistrada()],
  [VisitStatus.APPROVED, new EstadoAprobada()],
  [VisitStatus.CHECKED_IN, new EstadoIngresada()],
  [VisitStatus.COMPLETED, new EstadoFinalizada()],
  [VisitStatus.CANCELLED, new EstadoCancelada()],
  [VisitStatus.REJECTED, new EstadoRechazada()],
]);

export class VisitStateMachine {
  static estado(status: VisitStatus): EstadoVisita {
    const estado = estados.get(status);
    if (!estado) {
      throw new TransicionIlegal(`Estado desconocido: ${status}`);
    }
    return estado;
  }

  static aprobar(ctx: VisitContext, actorId: string): TransicionResultado {
    return this.estado(ctx.status).aprobar(ctx, actorId);
  }
  static rechazar(ctx: VisitContext): TransicionResultado {
    return this.estado(ctx.status).rechazar(ctx);
  }
  static cancelar(ctx: VisitContext): TransicionResultado {
    return this.estado(ctx.status).cancelar(ctx);
  }
  static validarIngreso(ctx: VisitContext, guardId: string, now?: Date): TransicionResultado {
    return this.estado(ctx.status).validarIngreso(ctx, guardId, now);
  }
  static registrarSalida(ctx: VisitContext, guardId: string, now?: Date): TransicionResultado {
    return this.estado(ctx.status).registrarSalida(ctx, guardId, now);
  }
}
