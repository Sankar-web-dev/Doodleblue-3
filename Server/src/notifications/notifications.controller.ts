import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { NotificationsService } from './notifications.service.js';
import { ListNotificationsQueryDto } from './dto.js';

// Notifications — users read their own; writes come from other modules.
@Controller('notifications')
@UseGuards(AuthGuard, RequirePasswordChangedGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async listMine(
    @Query() query: ListNotificationsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.notifications.listMine(
      query,
      req.user,
    );
    return { data, meta };
  }

  @Get('unread-count')
  async unreadCount(@Req() req: AuthenticatedRequest) {
    return {
      data: { count: await this.notifications.unreadCount(req.user) },
    };
  }

  @Patch('read-all')
  async markAllRead(@Req() req: AuthenticatedRequest) {
    return { data: await this.notifications.markAllRead(req.user) };
  }

  @Patch(':id/read')
  async markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        notification: await this.notifications.markRead(id, req.user),
      },
    };
  }
}
