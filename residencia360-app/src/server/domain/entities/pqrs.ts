import { PqrsStatus } from "@prisma/client";

import { CierrePqrsSinEvidencia, TransicionIlegal } from "@/server/domain/errors/domain-errors";

/**
 * Patron State (Entregable 3 §3.2, RN-09/10).
 * Modela el ciclo de vida formal de una PQRS.
 */
export type PqrsContext = {
  status: PqrsStatus;
  hasFinalResponse?: boolean;
  hasEvidence?: boolean;
};

export type PqrsTransicionResultado = {
  nuevoEstado: PqrsStatus;
  campos?: Partial<{ closedAt: Date; assignedToId: string }>;
};

export interface EstadoPqrs {
  readonly nombre: PqrsStatus;
  asignar(_: PqrsContext, assigneeId: string): PqrsTransicionResultado;
  iniciarGestion(_: PqrsContext): PqrsTransicionResultado;
  marcarThirdParty(_: PqrsContext): PqrsTransicionResultado;
  responder(_: PqrsContext): PqrsTransicionResultado;
  cerrar(_: PqrsContext): PqrsTransicionResultado;
  reabrir(_: PqrsContext): PqrsTransicionResultado;
}

abstract class EstadoBase implements EstadoPqrs {
  abstract readonly nombre: PqrsStatus;
  protected ilegal(operacion: string): never {
    throw new TransicionIlegal(`No se puede ${operacion} una PQRS en estado ${this.nombre}.`);
  }
  asignar(_: PqrsContext, _assigneeId: string): PqrsTransicionResultado {
    void _; void _assigneeId;
    this.ilegal("asignar");
  }
  iniciarGestion(_: PqrsContext): PqrsTransicionResultado {
    void _;
    this.ilegal("iniciar gestion en");
  }
  marcarThirdParty(_: PqrsContext): PqrsTransicionResultado {
    void _;
    this.ilegal("marcar como tercero");
  }
  responder(_: PqrsContext): PqrsTransicionResultado {
    void _;
    this.ilegal("responder");
  }
  cerrar(_: PqrsContext): PqrsTransicionResultado {
    void _;
    this.ilegal("cerrar");
  }
  reabrir(_: PqrsContext): PqrsTransicionResultado {
    void _;
    this.ilegal("reabrir");
  }
}

class EstadoRadicada extends EstadoBase {
  readonly nombre = PqrsStatus.FILED;
  override asignar(_: PqrsContext, assigneeId: string): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.IN_PROGRESS, campos: { assignedToId: assigneeId } };
  }
  override iniciarGestion(): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.IN_PROGRESS };
  }
  override responder(ctx: PqrsContext): PqrsTransicionResultado {
    if (!ctx.hasFinalResponse) {
      throw new TransicionIlegal("Debes registrar una respuesta final antes de resolver.");
    }
    return { nuevoEstado: PqrsStatus.RESOLVED };
  }
}

class EstadoEnProceso extends EstadoBase {
  readonly nombre = PqrsStatus.IN_PROGRESS;
  override asignar(_: PqrsContext, assigneeId: string): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.IN_PROGRESS, campos: { assignedToId: assigneeId } };
  }
  override marcarThirdParty(): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.THIRD_PARTY_PENDING };
  }
  override responder(ctx: PqrsContext): PqrsTransicionResultado {
    if (!ctx.hasFinalResponse) {
      throw new TransicionIlegal("Debes registrar una respuesta final antes de resolver.");
    }
    return { nuevoEstado: PqrsStatus.RESOLVED };
  }
}

class EstadoThirdParty extends EstadoBase {
  readonly nombre = PqrsStatus.THIRD_PARTY_PENDING;
  override iniciarGestion(): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.IN_PROGRESS };
  }
  override responder(ctx: PqrsContext): PqrsTransicionResultado {
    if (!ctx.hasFinalResponse) {
      throw new TransicionIlegal("Debes registrar una respuesta final antes de resolver.");
    }
    return { nuevoEstado: PqrsStatus.RESOLVED };
  }
}

class EstadoResuelta extends EstadoBase {
  readonly nombre = PqrsStatus.RESOLVED;
  override cerrar(ctx: PqrsContext): PqrsTransicionResultado {
    if (!ctx.hasFinalResponse || !ctx.hasEvidence) {
      throw new CierrePqrsSinEvidencia();
    }
    return { nuevoEstado: PqrsStatus.CLOSED, campos: { closedAt: new Date() } };
  }
  override reabrir(): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.IN_PROGRESS };
  }
}

class EstadoCerrada extends EstadoBase {
  readonly nombre = PqrsStatus.CLOSED;
  override reabrir(): PqrsTransicionResultado {
    return { nuevoEstado: PqrsStatus.IN_PROGRESS };
  }
}

const estados = new Map<PqrsStatus, EstadoPqrs>([
  [PqrsStatus.FILED, new EstadoRadicada()],
  [PqrsStatus.IN_PROGRESS, new EstadoEnProceso()],
  [PqrsStatus.THIRD_PARTY_PENDING, new EstadoThirdParty()],
  [PqrsStatus.RESOLVED, new EstadoResuelta()],
  [PqrsStatus.CLOSED, new EstadoCerrada()],
]);

export class PqrsStateMachine {
  static estado(status: PqrsStatus): EstadoPqrs {
    const estado = estados.get(status);
    if (!estado) {
      throw new TransicionIlegal(`Estado desconocido: ${status}`);
    }
    return estado;
  }

  static transitar(
    ctx: PqrsContext,
    target: PqrsStatus,
    options: { assigneeId?: string } = {},
  ): PqrsTransicionResultado {
    const estado = this.estado(ctx.status);
    switch (target) {
      case PqrsStatus.IN_PROGRESS:
        if (options.assigneeId) return estado.asignar(ctx, options.assigneeId);
        if (ctx.status === PqrsStatus.RESOLVED || ctx.status === PqrsStatus.CLOSED) {
          return estado.reabrir(ctx);
        }
        return estado.iniciarGestion(ctx);
      case PqrsStatus.THIRD_PARTY_PENDING:
        return estado.marcarThirdParty(ctx);
      case PqrsStatus.RESOLVED:
        return estado.responder(ctx);
      case PqrsStatus.CLOSED:
        return estado.cerrar(ctx);
      case PqrsStatus.FILED:
        throw new TransicionIlegal("No se puede volver al estado Radicada.");
      default:
        throw new TransicionIlegal(`Estado objetivo no soportado: ${target}`);
    }
  }
}
