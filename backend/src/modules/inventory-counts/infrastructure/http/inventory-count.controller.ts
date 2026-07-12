import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

import { CreateInventoryCountUseCase } from '@modules/inventory-counts/application/use-cases/create-inventory-count.use-case';
import { FindInventoryCountUseCase } from '@modules/inventory-counts/application/use-cases/find-inventory-count.use-case';
import {
  StartInventoryCountUseCase,
  CompleteInventoryCountUseCase,
  ApproveInventoryCountUseCase,
  CancelInventoryCountUseCase,
  UpdateInventoryCountUseCase,
} from '@modules/inventory-counts/application/use-cases/update-inventory-count.use-case';
import { UpdateInventoryCountItemUseCase } from '@modules/inventory-counts/application/use-cases/update-inventory-count-item.use-case';
import { ApplyInventoryCountAdjustmentsUseCase } from '@modules/inventory-counts/application/use-cases/apply-inventory-count-adjustments.use-case';

import {
  CreateInventoryCountDto,
  InventoryCountFiltersDto,
  UpdateCountItemDto,
} from '@modules/inventory-counts/infrastructure/dto/inventory-count.dto';

@ApiTags('Inventory Counts')
@ApiBearerAuth()
@Controller('inventory-counts')
export class InventoryCountController {
  constructor(
    private readonly createUseCase: CreateInventoryCountUseCase,
    private readonly findUseCase: FindInventoryCountUseCase,
    private readonly startUseCase: StartInventoryCountUseCase,
    private readonly completeUseCase: CompleteInventoryCountUseCase,
    private readonly approveUseCase: ApproveInventoryCountUseCase,
    private readonly cancelUseCase: CancelInventoryCountUseCase,
    private readonly updateUseCase: UpdateInventoryCountUseCase,
    private readonly updateItemUseCase: UpdateInventoryCountItemUseCase,
    private readonly applyAdjustmentsUseCase: ApplyInventoryCountAdjustmentsUseCase,
  ) {}

  @Post()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Crear nuevo conteo de inventario' })
  async create(
    @Body() dto: CreateInventoryCountDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.createUseCase.execute({
      tenantId: user.tenantId,
      userId: user.id,
      warehouseId: dto.warehouseId,
      name: dto.name,
      notes: dto.notes,
      productIds: dto.productIds,
      productWarehouseIds: dto.productWarehouseIds,
    });
  }

  @Get()
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Listar conteos de inventario' })
  async findAll(@Query() filters: any, @CurrentUser() user: AuthenticatedUser) {
    return this.findUseCase.findAll(
      user.tenantId,
      filters,
      filters.limit,
      filters.offset,
    );
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Obtener conteo por ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.findUseCase.findById(id, user.tenantId);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Actualizar conteo (solo borrador/in_progreso)' })
  async update(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateUseCase.execute({
      countId: id,
      tenantId: user.tenantId,
      ...dto,
    });
  }

  @Patch(':id/start')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Iniciar conteo (draft -> in_progress)' })
  async start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.startUseCase.execute({ countId: id, tenantId: user.tenantId });
  }

  @Patch(':id/complete')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Completar conteo (in_progress -> completed)' })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.completeUseCase.execute({
      countId: id,
      tenantId: user.tenantId,
    });
  }

  @Patch(':id/approve')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Aprobar conteo (completed -> approved)' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.approveUseCase.execute({
      countId: id,
      tenantId: user.tenantId,
      approverId: user.id,
    });
  }

  @Patch(':id/cancel')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Cancelar conteo' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cancelUseCase.execute({ countId: id, tenantId: user.tenantId });
  }

  @Patch(':id/items/:itemId')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Actualizar cantidad contada de un ítem' })
  async updateItem(
    @Param('id') countId: string,
    @Param('itemId') itemId: string,
    @Body() dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateItemUseCase.execute({
      countId,
      itemId,
      tenantId: user.tenantId,
      countedQty: dto.countedQty,
      notes: dto.notes,
    });
  }

  @Post(':id/apply-adjustments')
  @Roles('admin', 'gerente')
  @ApiOperation({ summary: 'Aplicar ajustes de stock desde conteo aprobado' })
  async applyAdjustments(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.applyAdjustmentsUseCase.execute({
      countId: id,
      tenantId: user.tenantId,
      userId: user.id,
    });
  }
}
