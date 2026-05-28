export type DomainErrorCode =
  | "TOKEN_INEXISTENTE"
  | "INGRESO_DENEGADO"
  | "TRANSICION_ILEGAL"
  | "REGLA_RESERVA_VIOLADA"
  | "VALIDACION_DATOS"
  | "CIERRE_PQRS_SIN_EVIDENCIA"
  | "ENTIDAD_NO_ENCONTRADA";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly detail?: string;
  readonly httpStatus: number;

  constructor(code: DomainErrorCode, message: string, opts?: { detail?: string; httpStatus?: number }) {
    super(message);
    this.code = code;
    this.detail = opts?.detail;
    this.httpStatus = opts?.httpStatus ?? 422;
    this.name = "DomainError";
  }
}

export class TokenInexistente extends DomainError {
  constructor(message = "El codigo QR no existe o no esta activo.") {
    super("TOKEN_INEXISTENTE", message);
  }
}

export class IngresoDenegado extends DomainError {
  constructor(message: string, detail?: string) {
    super("INGRESO_DENEGADO", message, { detail });
  }
}

export class TransicionIlegal extends DomainError {
  constructor(message: string) {
    super("TRANSICION_ILEGAL", message, { httpStatus: 409 });
  }
}

export class ReglaReservaViolada extends DomainError {
  constructor(message: string, detail?: string) {
    super("REGLA_RESERVA_VIOLADA", message, { detail, httpStatus: 409 });
  }
}

export class CierrePqrsSinEvidencia extends DomainError {
  constructor() {
    super(
      "CIERRE_PQRS_SIN_EVIDENCIA",
      "El cierre de una PQRS requiere respuesta final y evidencia (RN-10).",
    );
  }
}

export class EntidadNoEncontrada extends DomainError {
  constructor(entityName: string) {
    super("ENTIDAD_NO_ENCONTRADA", `${entityName} no encontrado.`, { httpStatus: 404 });
  }
}

export type ActionResult<T = void> =
  | { success: true; message: string; data?: T }
  | { success: false; message: string; code?: DomainErrorCode; detail?: string };

export function fromDomainError(error: unknown, fallbackMessage = "Operacion fallida."): ActionResult<never> {
  if (error instanceof DomainError) {
    return { success: false, message: error.message, code: error.code, detail: error.detail };
  }
  if (error instanceof Error) {
    return { success: false, message: error.message || fallbackMessage };
  }
  return { success: false, message: fallbackMessage };
}
