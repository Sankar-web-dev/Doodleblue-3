import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarMulterOptions } from '../common/avatar-upload.js';
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
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto.js';

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

  /**
   * Public self-signup. A roleId may be supplied — it must reference an
   * active role; without one the user gets the fixed "USER" role.
   * Auto-logs the user in (session cookie set).
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const taken = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (taken) {
      throw new ApiException(
        409,
        'EMAIL_IN_USE',
        'A user with this email already exists',
      );
    }

    let role: { id: string; name: string } | null = null;
    if (dto.roleId) {
      role = await this.prisma.role.findFirst({
        where: { id: dto.roleId, isActive: true },
        select: { id: true, name: true },
      });
      if (!role) {
        throw new ApiException(
          400,
          'INVALID_ROLE',
          'Selected role is not available for self-signup',
        );
      }
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: role?.name ?? 'USER',
        roleId: role?.id ?? null,
        image: dto.image,
        mustChangePassword: false,
        isActive: true,
      },
      include: { roleRef: true },
    });

    const session = await this.auth.createSession(user.id);
    res.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());

    return {
      data: { user: await this.auth.safeUser(user) },
    };
  }

  /** Active roles offered for selection on the self-signup page. */
  @Get('signup-roles')
  async signupRoles() {
    const roles = await this.prisma.role.findMany({
      where: { isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
    return { data: roles };
  }

  /**
   * Public avatar upload for the signup form (not yet authenticated).
   * Returns a relative path to pass as `image` on register.
   */
  @Post('upload-avatar')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  uploadAvatar(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new ApiException(
        400,
        'NO_FILE_UPLOADED',
        'No image file provided',
      );
    }
    return {
      data: {
        url: `/uploads/profiles/${file.filename}`,
        filename: file.filename,
      },
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
