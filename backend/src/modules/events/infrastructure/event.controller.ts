import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PostgresEventRepo } from './PostgresEventRepo';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(private readonly repo: PostgresEventRepo) {}

  @Get()
  @Roles('admin', 'gerente', 'vendedor')
  findAll(
    @CurrentUser() user: any,
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
  findById(@Param('id') id: string) {
    return this.repo.findById(id);
  }

  @Post()
  @Roles('admin', 'gerente')
  create(@CurrentUser() user: any, @Body() body: CreateEventDto) {
    return this.repo.create({
      tenantId: user.tenantId,
      createdBy: user.uid,
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
  update(@Param('id') id: string, @Body() body: UpdateEventDto) {
    return this.repo.update(id, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete(':id')
  @Roles('admin')
  delete(@Param('id') id: string) {
    return this.repo.delete(id);
  }
}
