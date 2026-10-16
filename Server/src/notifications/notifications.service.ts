import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import { listMeta, pageParams } from '../common/pagination.js';
import { ListNotificationsQueryDto } from './dto.js';
import type { UserModel } from '../generated/prisma/models.js';
import type { NotificationType } from '../generated/prisma/enums.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Internal — other modules call this to notify a user. */
  async notify(
    userId: string,
    input: {
      type: NotificationType;
      title: string;
      message: string;
      link?: string;
    },
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
      },
    });
  }

  /** The caller's notifications, newest first. */
  async listMine(query: ListNotificationsQueryDto, user: UserModel) {
    const { skip, take, page, limit } = pageParams(query);

    const where = {
      userId: user.id,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [data, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return { data, meta: { ...listMeta(total, page, limit), unread } };
  }

  unreadCount(user: UserModel) {
    return this.prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });
  }

  async markRead(id: string, user: UserModel) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!notification) {
      throw new ApiException(
        404,
        'NOTIFICATION_NOT_FOUND',
        'Notification not found',
      );
    }
    if (notification.userId !== user.id) {
      throw new ApiException(
        403,
        'FORBIDDEN',
        'You cannot modify this notification',
      );
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(user: UserModel) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: count };
  }
}
