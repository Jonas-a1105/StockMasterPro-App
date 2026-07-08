import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.supplierService.findAll(user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.supplierService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateSupplierDto, @CurrentUser() user: any) {
    return this.supplierService.create({ ...dto, tenantId: user.tenantId });
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() user: any,
  ) {
    return this.supplierService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.supplierService.delete(id, user.tenantId);
  }
}
