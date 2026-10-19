import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
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
import { BloodBankProfileService } from './blood-bank-profile.service.js';
import {
  ListBloodBanksQueryDto,
  UpsertBloodBankProfileDto,
  VerifyBloodBankDto,
} from './dto.js';

// Blood bank / hospital profiles — institutions manage their own;
// admins list all and record verification decisions.
@Controller('profiles/blood-bank')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class BloodBankProfileController {
  constructor(private readonly profiles: BloodBankProfileService) {}

  /** Admin directory of all registered institutions. */
  @Get()
  @RequirePermission('profiles', 'read')
  async list(@Query() query: ListBloodBanksQueryDto) {
    const { data, meta } = await this.profiles.list(query);
    return { data, meta };
  }

  @Get('me')
  async getMine(@Req() req: AuthenticatedRequest) {
    return {
      data: { profile: await this.profiles.getForUser(req.user.id) },
    };
  }

  @Put('me')
  async upsertMine(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertBloodBankProfileDto,
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
    @Body() dto: UpsertBloodBankProfileDto,
  ) {
    return {
      data: { profile: await this.profiles.upsertForUser(userId, dto) },
    };
  }

  /** Approve / reject / suspend an institution's verification. */
  @Patch(':id/verification')
  @RequirePermission('profiles', 'update')
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyBloodBankDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        profile: await this.profiles.verify(id, dto, req.user.id),
      },
    };
  }
}
