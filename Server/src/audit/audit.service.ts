import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { listMeta, pageParams } from '../common/pagination.js';
import type { ListAuditLogsQueryDto } from './dto.js';

export interface AuditEntry {
  actorUserId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Audit trail for admin/security-sensitive actions.
 * Never store passwords, tokens, or raw medical details in `details`.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record an audit event. Fire-and-forget safe — failures are swallowed so
   * an audit write never breaks a request path.
   */
  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.auditLog
      .create({
        data: {
          actorUserId: entry.actorUserId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details as object | undefined,
          ipAddress: entry.ipAddress,
        },
      })
      .catch(() => {});
  }

  /** Admin view — paginated, filterable audit log. */
  async list(query: ListAuditLogsQueryDto) {
    const { skip, take, page, limit } = pageParams(query);

    const where = {
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.resource ? { resource: query.resource } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          actor: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, meta: listMeta(total, page, limit) };
  }
}
