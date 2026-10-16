import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { DonationsService } from './donations.service.js';
import {
  ListDonationsQueryDto,
  RegisterDonationDto,
  ReviewScreeningDto,
  UpdateDonationDto,
  UpsertScreeningDto,
} from './dto.js';

// Donations — one record per actual donation event, incl. health screening.
@Controller('donations')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class DonationsController {
  constructor(private readonly donations: DonationsService) {}

  @Post()
  async register(
    @Body() dto: RegisterDonationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        donation: await this.donations.register(
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  @Get()
  @RequirePermission('users', 'read')
  async listAll(@Query() query: ListDonationsQueryDto) {
    const { data, meta } = await this.donations.listAll(query);
    return { data, meta };
  }

  @Get('mine')
  async listMine(
    @Query() query: ListDonationsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.donations.listMine(query, req.user);
    return { data, meta };
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        donation: await this.donations.getById(id, req.user, req.currentRole),
      },
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDonationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        donation: await this.donations.update(
          id,
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  /** Admin verification stamp on a completed donation. */
  @Patch(':id/verify')
  @RequirePermission('users', 'update')
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        donation: await this.donations.verify(id, req.user, req.currentRole),
      },
    };
  }

  @Get(':id/screening')
  async getScreening(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        screening: await this.donations.getScreening(
          id,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  /** Pre-donation questionnaire — donor or staff. */
  @Put(':id/screening')
  async upsertScreening(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertScreeningDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        screening: await this.donations.upsertScreening(
          id,
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  /** Clinical review — staff only (users:update). */
  @Patch(':id/screening/review')
  @RequirePermission('users', 'update')
  async reviewScreening(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewScreeningDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        screening: await this.donations.reviewScreening(
          id,
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }
}
