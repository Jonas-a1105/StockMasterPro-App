export type InventoryCountStatus = 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

export class InventoryCountItem {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly inventoryCountId: string,
    public readonly productId: string,
    public readonly productWarehouseId: string | null,
    public readonly systemQty: number,
    public countedQty: number | null,
    public difference: number,
    public notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  setCountedQty(qty: number) {
    this.countedQty = qty;
    this.difference = qty - this.systemQty;
  }

  hasVariance(): boolean {
    return this.difference !== 0;
  }
}

export class InventoryCount {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public warehouseId: string | null,
    public readonly userId: string,
    public status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled',
    public name: string | null,
    public notes: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public startedAt: Date | null = null,
    public completedAt: Date | null = null,
    public approvedBy: string | null = null,
    public approvedAt: Date | null = null,
    public readonly items: InventoryCountItem[] = [],
    public warehouse: { id: string; name: string } | null = null,
    public user: { id: string; name: string } | null = null,
    public approver: { id: string; name: string } | null = null,
  ) {}

  static create(
    id: string,
    tenantId: string,
    warehouseId: string | null,
    userId: string,
    name: string | null,
  ): InventoryCount {
    return new InventoryCount(
      id,
      tenantId,
      warehouseId,
      userId,
      'draft',
      name,
      null,
      new Date(),
      new Date(),
    );
  }

  start() {
    if (this.status !== 'draft') {
      throw new Error('Solo se pueden iniciar conteos en estado borrador');
    }
    this.status = 'in_progress';
    this.startedAt = new Date();
    this.updatedAt = new Date();
  }

  complete() {
    if (this.status !== 'in_progress') {
      throw new Error('Solo se pueden completar conteos en progreso');
    }
    this.status = 'completed';
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  approve(approverId: string) {
    if (this.status !== 'completed') {
      throw new Error('Solo se pueden aprobar conteos completados');
    }
    this.status = 'approved';
    this.approvedBy = approverId;
    this.approvedAt = new Date();
    this.updatedAt = new Date();
  }

  cancel() {
    if (this.status === 'approved') {
      throw new Error('No se puede cancelar un conteo aprobado');
    }
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  canEdit(): boolean {
    return this.status === 'draft' || this.status === 'in_progress';
  }

  hasVariance(): boolean {
    return this.items.some(item => item.difference !== 0);
  }
}

export class InventoryCountNotFoundException extends Error {
  constructor(id: string) {
    super(`Conteo de inventario ${id} no encontrado`);
    this.name = 'InventoryCountNotFoundException';
  }
}

export class InventoryCountInvalidStateException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryCountInvalidStateException';
  }
}