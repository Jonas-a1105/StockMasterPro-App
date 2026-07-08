import { DomainException } from '@shared/domain/domain-exception';

export class PayableNotFoundException extends DomainException {
  readonly code = 'PAYABLE_NOT_FOUND';
  override readonly status = 404;
  constructor() {
    super('Cuenta por pagar no encontrada');
  }
}

export class PayableAlreadyPaidException extends DomainException {
  readonly code = 'PAYABLE_ALREADY_PAID';
  override readonly status = 400;
  constructor() {
    super('Esta cuenta ya está pagada');
  }
}

export class InvalidPaymentAmountException extends DomainException {
  readonly code = 'INVALID_PAYMENT_AMOUNT';
  override readonly status = 400;
  constructor(msg: string) {
    super(msg);
  }
}
