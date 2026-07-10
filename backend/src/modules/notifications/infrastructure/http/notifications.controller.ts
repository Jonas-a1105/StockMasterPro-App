import { Controller, Get, Patch, Post, Body, Param } from '@nestjs/common';
import { NotificationsService } from '../../application/notifications.service';
import { Roles } from '@shared/infrastructure/decorators/roles.decorator';
import { CurrentUser } from '@shared/infrastructure/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/infrastructure/types/authenticated-user';

@Controller('notifications')
@Roles('admin', 'gerente', 'vendedor')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAll(user.tenantId, user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count = await this.notificationsService.countUnread(
      user.tenantId,
      user.id,
    );
    return { count };
  }

  @Post()
  async create(
    @Body()
    body: { type: string; title: string; message?: string; link?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.notificationsService.create({
      tenantId: user.tenantId,
      userId: user.id,
      fromUserId: user.id,
      type: body.type,
      title: body.title,
      message: body.message,
      link: body.link,
    });
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.notificationsService.markAsRead(id, user.id);
    return { ok: true };
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAllAsRead(user.tenantId, user.id);
    return { ok: true };
  }
}
