import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PostgresWarehouseRepo } from './PostgresWarehouseRepo';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(private readonly repo: PostgresWarehouseRepo) {}

  @Get()
  @Roles('admin', 'gerente', 'vendedor')
  findAll(@CurrentUser() user: any) {
    return this.repo.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente', 'vendedor')
  findById(@Param('id') id: string) {
    return this.repo.findById(id);
  }

  @Post()
  @Roles('admin')
  create(@CurrentUser() user: any, @Body() body: { name: string; code: string; address?: string }) {
    return this.repo.create({ tenantId: user.tenantId, ...body });
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() body: { name?: string; code?: string; address?: string; isActive?: boolean }) {
    return this.repo.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.repo.delete(id);
  }
}
