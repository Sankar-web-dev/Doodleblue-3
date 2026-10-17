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
import { AppointmentsService } from './appointments.service.js';
import {
  CreateAppointmentDto,
  ListAppointmentsQueryDto,
  UpdateAppointmentDto,
} from './dto.js';

// Donation appointments — donors book, request owners & admins oversee.
@Controller('appointments')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  async create(
    @Body() dto: CreateAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        appointment: await this.appointments.create(
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  @Get('mine')
  async listMine(
    @Query() query: ListAppointmentsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.appointments.listMine(
      query,
      req.user,
    );
    return { data, meta };
  }

  /** Blood bank view — appointments across all of the caller's requests. */
  @Get('manage')
  async listOwned(
    @Query() query: ListAppointmentsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.appointments.listOwned(query, req.user);
    return { data, meta };
  }

  // Must precede :id so "request" isn't parsed as a uuid.
  @Get('request/:requestId')
  async listForRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Query() query: ListAppointmentsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.appointments.listForRequest(
      requestId,
      query,
      req.user,
      req.currentRole,
    );
    return { data, meta };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        appointment: await this.appointments.update(
          id,
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  /** Soft-delete — appointments are cancelled, not removed. */
  @Delete(':id')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        appointment: await this.appointments.cancel(
          id,
          req.user,
          req.currentRole,
        ),
      },
    };
  }
}
