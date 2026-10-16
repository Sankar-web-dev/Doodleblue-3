import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { RequestsService } from './requests.service.js';
import {
  CreateBloodRequestDto,
  ListBloodRequestsQueryDto,
  UpdateBloodRequestDto,
  UpdateRequestStatusDto,
} from './dto.js';

// Blood requests — recipients/banks create them, donors browse & respond.
@Controller('requests')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Post()
  async create(
    @Body() dto: CreateBloodRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: { request: await this.requests.create(dto, req.user) },
    };
  }

  @Get()
  async list(
    @Query() query: ListBloodRequestsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.requests.list(query, req.user);
    return { data, meta };
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return { data: { request: await this.requests.getById(id) } };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBloodRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        request: await this.requests.update(
          id,
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequestStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        request: await this.requests.setStatus(
          id,
          dto.status,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  /** Soft-delete — requests are cancelled, not removed. */
  @Delete(':id')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        request: await this.requests.cancel(id, req.user, req.currentRole),
      },
    };
  }
}
