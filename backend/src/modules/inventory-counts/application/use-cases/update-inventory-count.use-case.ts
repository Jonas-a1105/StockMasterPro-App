import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryCount, InventoryCountNotFoundException, InventoryCountInvalidStateException } from '@modules/inventory-counts';
import {
  InventoryCountRepository,
  INVENTORY_COUNT_REPOSITORY,
} from '../ports/inventory-count.repository.interface';

interface UpdateCountInput {
  countId: string;
  tenantId: string;
  name?: string;
  notes?: string;
  warehouseId?: string;
}

@Injectable()
export class UpdateInventoryCountUseCase {
  constructor(
    @Inject('INVENTORY_COUNT_REPOSITORY')
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async execute(input: UpdateCountInput): Promise<InventoryCount> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    if (!count.canEdit()) {
      throw new BadRequestException('No se puede editar un conteo en estado ' + count.status);
    }

    if (input.name !== undefined) count.name = input.name;
    if (input.notes !== undefined) count.notes = input.notes;
    if (input.warehouseId !== undefined) count.warehouseId = input.warehouseId;

    return this.countRepo.update(count);
  }
}

interface StartCountInput {
  countId: string;
  tenantId: string;
}

@Injectable()
export class StartInventoryCountUseCase {
  constructor(
    @Inject('INVENTORY_COUNT_REPOSITORY')
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async execute(input: StartCountInput): Promise<InventoryCount> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    if (count.status !== 'draft') {
      throw new BadRequestException('Solo se pueden iniciar conteos en estado borrador');
    }

    count.start();
    return this.countRepo.update(count);
  }
}

interface CompleteCountInput {
  countId: string;
  tenantId: string;
}

@Injectable()
export class CompleteInventoryCountUseCase {
  constructor(
    @Inject('INVENTORY_COUNT_REPOSITORY')
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async execute(input: CompleteCountInput): Promise<InventoryCount> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    if (count.status !== 'in_progress') {
      throw new BadRequestException('Solo se pueden completar conteos en progreso');
    }

    count.complete();
    return this.countRepo.update(count);
  }
}

interface ApproveCountInput {
  countId: string;
  tenantId: string;
  approverId: string;
}

@Injectable()
export class ApproveInventoryCountUseCase {
  constructor(
    @Inject('INVENTORY_COUNT_REPOSITORY')
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async execute(input: ApproveCountInput): Promise<InventoryCount> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    if (count.status !== 'completed') {
      throw new BadRequestException('Solo se pueden aprobar conteos completados');
    }

    count.approve(input.approverId);
    return this.countRepo.update(count);
  }
}

interface CancelCountInput {
  countId: string;
  tenantId: string;
}

@Injectable()
export class CancelInventoryCountUseCase {
  constructor(
    @Inject('INVENTORY_COUNT_REPOSITORY')
    private readonly countRepo: InventoryCountRepository,
  ) {}

  async execute(input: CancelCountInput): Promise<InventoryCount> {
    const count = await this.countRepo.findById(input.countId, input.tenantId);
    if (!count) throw new NotFoundException('Conteo no encontrado');

    count.cancel();
    return this.countRepo.update(count);
  }
}