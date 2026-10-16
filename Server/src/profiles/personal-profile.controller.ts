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
import { PersonalProfileService } from './personal-profile.service.js';
import { UpsertPersonalProfileDto } from './dto.js';

// Personal details — users manage their own; admins act via :userId.
@Controller('profiles/personal')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class PersonalProfileController {
  constructor(private readonly profiles: PersonalProfileService) {}

  @Get('me')
  async getMine(@Req() req: AuthenticatedRequest) {
    return {
      data: { profile: await this.profiles.getForUser(req.user.id) },
    };
  }

  @Put('me')
  async upsertMine(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertPersonalProfileDto,
  ) {
    return {
      data: {
        profile: await this.profiles.upsertForUser(req.user.id, dto),
      },
    };
  }

  @Get('user/:userId')
  @RequirePermission('users', 'read')
  async getForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return { data: { profile: await this.profiles.getForUser(userId) } };
  }

  @Put('user/:userId')
  @RequirePermission('users', 'update')
  async upsertForUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpsertPersonalProfileDto,
  ) {
    return {
      data: { profile: await this.profiles.upsertForUser(userId, dto) },
    };
  }
}
