import { DomainException } from '@shared/domain/domain-exception';

export class SessionNotFoundException extends DomainException {
  readonly code = 'SESSION_NOT_FOUND';
  override readonly status = 404;
  constructor() {
    super('Sesión de caja no encontrada');
  }
}

export class SessionAlreadyClosedException extends DomainException {
  readonly code = 'SESSION_ALREADY_CLOSED';
  override readonly status = 400;
  constructor() {
    super('La sesión de caja ya está cerrada');
  }
}

export class SessionAlreadyOpenException extends DomainException {
  readonly code = 'SESSION_ALREADY_OPEN';
  override readonly status = 400;
  constructor() {
    super('Ya existe una sesión de caja abierta para este usuario');
  }
}

export class InvalidTransactionTypeException extends DomainException {
  readonly code = 'INVALID_TRANSACTION_TYPE';
  override readonly status = 400;
  constructor(type: string) {
    super(`Tipo de transacción inválido: "${type}". Valores válidos: income, expense, sale, refund`);
  }
}
