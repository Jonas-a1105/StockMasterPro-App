import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { WarehouseTransferService } from '../../application/warehouse-transfer.service';
import {
  CreateWarehouseTransferDto,
  UpdateWarehouseTransferDto,
} from '../dto/create-warehouse-transfer.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('warehouse-transfers')
@Roles('admin', 'gerente')
export class WarehouseTransferController {
  constructor(private readonly service: WarehouseTransferService) {}

  @Get()
  async findAll(
    @Query('status') status: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(user.tenantId, status);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findById(id, user.tenantId);
  }

  @Post()
  async create(
    @Body() dto: CreateWarehouseTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id, user.tenantId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateStatus(id, user.tenantId, dto.status!, dto.notes);
  }
}
