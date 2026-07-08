import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';
import { PostgresEventRepo } from '../persistence/postgres-event.repository';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly repo: PostgresEventRepo) {}

  @Get()
  @Roles('admin', 'gerente', 'vendedor')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    if (start && end) {
      return this.repo.findByDateRange(user.tenantId, new Date(start), new Date(end));
    }
    return this.repo.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles('admin', 'gerente', 'vendedor')
  findById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.repo.findById(id, user.tenantId);
  }

  @Post()
  @Roles('admin', 'gerente')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateEventDto) {
    return this.repo.create({
      tenantId: user.tenantId,
      createdBy: user.id,
      title: body.title,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      allDay: body.allDay,
      color: body.color,
    });
  }

  @Put(':id')
  @Roles('admin', 'gerente')
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: UpdateEventDto) {
    return this.repo.update(id, user.tenantId, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.repo.delete(id, user.tenantId);
  }
}
