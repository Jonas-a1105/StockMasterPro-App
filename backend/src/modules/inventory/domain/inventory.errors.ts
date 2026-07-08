import { DomainException } from '@shared/domain/domain-exception';

export class ProductNotFoundException extends DomainException {
  readonly code = 'PRODUCT_NOT_FOUND';
  override readonly status = 404;
  constructor() {
    super('Producto no encontrado');
  }
}

export class DuplicateBarcodeException extends DomainException {
  readonly code = 'DUPLICATE_BARCODE';
  override readonly status = 400;
  constructor() {
    super('Ya existe un producto con este código de barras');
  }
}

export class InvalidStockAdjustmentException extends DomainException {
  readonly code = 'INVALID_STOCK_ADJUSTMENT';
  override readonly status = 400;
  constructor(msg: string) {
    super(msg);
  }
}
