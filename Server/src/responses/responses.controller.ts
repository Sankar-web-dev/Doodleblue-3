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
import { ResponsesService } from './responses.service.js';
import {
  CreateDonorResponseDto,
  ListResponsesQueryDto,
  UpdateDonorResponseDto,
} from './dto.js';

// Donor responses — donors answer open blood requests.
@Controller('responses')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class ResponsesController {
  constructor(private readonly responses: ResponsesService) {}

  @Post()
  async create(
    @Body() dto: CreateDonorResponseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: { response: await this.responses.create(dto, req.user) },
    };
  }

  @Get('mine')
  async listMine(
    @Query() query: ListResponsesQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.responses.listMine(query, req.user);
    return { data, meta };
  }

  // Must precede :id so "request" isn't parsed as a uuid.
  @Get('request/:requestId')
  async listForRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Query() query: ListResponsesQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.responses.listForRequest(
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
    @Body() dto: UpdateDonorResponseDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: {
        response: await this.responses.update(
          id,
          dto,
          req.user,
          req.currentRole,
        ),
      },
    };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.responses.remove(id, req.user, req.currentRole);
    return { data: { message: 'Response withdrawn' } };
  }
}
