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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'gerente')
  async findAll(@CurrentUser() user: any) {
    return this.usersService.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create({ ...dto, tenantId: user.tenantId });
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.delete(id, user.tenantId);
  }
}
