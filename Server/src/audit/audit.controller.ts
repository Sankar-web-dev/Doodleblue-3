import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { AuditService } from './audit.service.js';
import { ListAuditLogsQueryDto } from './dto.js';

// Audit log — read-only, admin-only listing.
@Controller('audit-logs')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermission('audit', 'read')
  async list(@Query() query: ListAuditLogsQueryDto) {
    const { data, meta } = await this.audit.list(query);
    return { data, meta };
  }
}
