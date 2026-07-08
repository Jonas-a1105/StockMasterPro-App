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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.categoryService.findAll(user.tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoryService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    return this.categoryService.create(user.tenantId, dto.name);
  }

  @Patch(':id')
  @Roles('admin', 'gerente')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    return this.categoryService.update(id, user.tenantId, dto.name!);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoryService.delete(id, user.tenantId);
  }
}
