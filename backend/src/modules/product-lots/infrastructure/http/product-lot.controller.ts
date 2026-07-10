import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductLotService } from '../../application/product-lot.service';
import {
  CreateProductLotDto,
  UpdateProductLotDto,
} from '../dto/product-lot.dto';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { JwtAuthGuard } from '@shared/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/infrastructure/guards/roles.guard';

@Controller('product-lots')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'gerente')
export class ProductLotController {
  constructor(private readonly service: ProductLotService) {}

  @Get()
  async findAll(
    @Query('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(user.tenantId, productId);
  }

  @Get('expiring')
  async expiringSoon(
    @Query('days') days = '30',
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getExpiringSoon(user.tenantId, parseInt(days));
  }

  @Get('expired')
  async expired(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getExpired(user.tenantId);
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
    @Body() dto: CreateProductLotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.id, user.tenantId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductLotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.tenantId, user.id);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.service.delete(id, user.tenantId, user.id);
    return { ok: true };
  }
}
