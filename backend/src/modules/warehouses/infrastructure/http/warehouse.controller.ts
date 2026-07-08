import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { WarehouseService } from '../warehouse.service';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';

@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

  @Get()
  @Roles('admin', 'gerente', 'vendedor')
  findAll(@CurrentUser() user: any) {
    return this.service.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente', 'vendedor')
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin')
  create(@CurrentUser() user: any, @Body() body: CreateWarehouseDto) {
    return this.service.create(user.tenantId, body);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: UpdateWarehouseDto,
  ) {
    return this.service.update(id, user.tenantId, body);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.tenantId);
  }
}
