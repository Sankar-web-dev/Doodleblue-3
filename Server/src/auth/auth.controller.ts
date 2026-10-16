import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApiException } from '../common/api-error.js';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from '../common/constants.js';
import { AuthService, type UserWithRole } from './auth.service.js';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from './auth.guard.js';
import { CurrentUser } from './current-user.decorator.js';
import { ChangePasswordDto, LoginDto } from './dto.js';

function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite =
    process.env.SESSION_SAME_SITE === 'none' ? 'none' : 'lax';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSite as 'lax' | 'none',
    path: '/',
    maxAge: SESSION_TTL_MS,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roleRef: true },
    });

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new ApiException(
        401,
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    const session = await this.auth.createSession(user.id);
    res.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());

    return {
      data: { user: await this.auth.safeUser(user) },
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.deleteSession(req.sessionToken);
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:
        process.env.SESSION_SAME_SITE === 'none' ? 'none' : 'lax',
      path: '/',
    });

    return { data: { message: 'Logged out successfully' } };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: UserWithRole) {
    return { data: { user: await this.auth.safeUser(user) } };
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.isActive) {
      throw new ApiException(
        401,
        'SESSION_INVALID',
        'Please log in again',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new ApiException(
        400,
        'INCORRECT_CURRENT_PASSWORD',
        'Current password is incorrect',
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new ApiException(
        400,
        'PASSWORD_UNCHANGED',
        'Choose a different password',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 12),
        mustChangePassword: false,
      },
    });

    // Rotate the session after a credential change.
    const session = await this.auth.rotateSession(
      req.sessionToken,
      user.id,
    );
    res.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());

    return { data: { message: 'Password changed successfully' } };
  }
}
