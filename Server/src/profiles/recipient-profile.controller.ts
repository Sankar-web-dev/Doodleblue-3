import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { RecipientProfileService } from './recipient-profile.service.js';
import { UpsertRecipientProfileDto } from './dto.js';

// Recipient profile — users manage their own; admins act via :userId.
@Controller('profiles/recipient')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class RecipientProfileController {
  constructor(private readonly profiles: RecipientProfileService) {}

  @Get('me')
  async getMine(@Req() req: AuthenticatedRequest) {
    return {
      data: { profile: await this.profiles.getForUser(req.user.id) },
    };
  }

  @Put('me')
  async upsertMine(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertRecipientProfileDto,
  ) {
    return {
      data: {
        profile: await this.profiles.upsertForUser(req.user.id, dto),
      },
    };
  }

  @Get('user/:userId')
  @RequirePermission('profiles', 'read')
  async getForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return { data: { profile: await this.profiles.getForUser(userId) } };
  }

  @Put('user/:userId')
  @RequirePermission('profiles', 'update')
  async upsertForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpsertRecipientProfileDto,
  ) {
    return {
      data: { profile: await this.profiles.upsertForUser(userId, dto) },
    };
  }
}
