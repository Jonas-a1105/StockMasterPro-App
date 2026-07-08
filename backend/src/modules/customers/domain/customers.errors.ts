import { DomainException } from '@shared/domain/domain-exception';

export class CustomerNotFoundException extends DomainException {
  readonly code = 'CUSTOMER_NOT_FOUND';
  override readonly status = 404;
  constructor() {
    super('Cliente no encontrado');
  }
}

export class InvalidCreditAmountException extends DomainException {
  readonly code = 'INVALID_CREDIT_AMOUNT';
  override readonly status = 400;
  constructor(msg: string) {
    super(msg);
  }
}
