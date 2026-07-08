import { DomainException } from '@shared/domain/domain-exception';

export class ProductNotFoundException extends DomainException {
  readonly code = 'PRODUCT_NOT_FOUND';
  override readonly status = 404;
  constructor(id: string) {
    super(`Producto ${id} no encontrado`);
  }
}

export class InsufficientStockException extends DomainException {
  readonly code = 'INSUFFICIENT_STOCK';
  override readonly status = 400;
  constructor(name: string, available: number, requested: number) {
    super(`Stock insuficiente para ${name}. Disponible: ${available}, solicitado: ${requested}`);
  }
}

export class SaleNotFoundException extends DomainException {
  readonly code = 'SALE_NOT_FOUND';
  override readonly status = 404;
  constructor() {
    super('Venta no encontrada');
  }
}

export class CreditLimitExceededException extends DomainException {
  readonly code = 'CREDIT_LIMIT_EXCEEDED';
  override readonly status = 400;
  constructor(limit: number, expected: number) {
    super(`Límite de crédito excedido. Límite: $${limit.toFixed(2)}, Nuevo saldo esperado: $${expected.toFixed(2)}`);
  }
}

export class InvalidSaleOperationException extends DomainException {
  readonly code = 'INVALID_SALE_OPERATION';
  override readonly status = 400;
  constructor(msg: string) {
    super(msg);
  }
}
