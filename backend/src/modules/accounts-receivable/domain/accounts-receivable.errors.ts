import { DomainException } from '@shared/domain/domain-exception';

export class ReceivableNotFoundException extends DomainException {
  readonly code = 'RECEIVABLE_NOT_FOUND';
  override readonly status = 404;
  constructor() {
    super('Cuenta por cobrar no encontrada');
  }
}

export class ReceivableAlreadyPaidException extends DomainException {
  readonly code = 'RECEIVABLE_ALREADY_PAID';
  override readonly status = 400;
  constructor() {
    super('Esta cuenta por cobrar ya está totalmente pagada');
  }
}

export class InvalidReceivablePaymentException extends DomainException {
  readonly code = 'INVALID_RECEIVABLE_PAYMENT';
  override readonly status = 400;
  constructor(msg: string) {
    super(msg);
  }
}
