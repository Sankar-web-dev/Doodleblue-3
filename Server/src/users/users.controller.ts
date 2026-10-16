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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import fs from 'fs';
import path from 'path';
import { ApiException } from '../common/api-error.js';
import {
  AuthGuard,
  type AuthenticatedRequest,
} from '../auth/auth.guard.js';
import { RequirePasswordChangedGuard } from '../auth/require-password-changed.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermission } from '../auth/permissions.decorator.js';
import { UsersService } from './users.service.js';
import {
  CreateUserDto,
  ListUsersQueryDto,
  UpdateUserDto,
} from './dto.js';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'profiles');

const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOAD_ROOT)) {
      fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    }
    cb(null, UPLOAD_ROOT);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

const avatarFileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiException(
        400,
        'INVALID_FILE_TYPE',
        'Only JPEG, PNG, WEBP, and GIF images are allowed',
      ),
      false,
    );
  }
};

// User-account provisioning — SUPER_ADMIN (or any role granted users:*).
@Controller('users')
@UseGuards(AuthGuard, RequirePasswordChangedGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @RequirePermission('users', 'create')
  createUser(@Body() dto: CreateUserDto) {
    return this.users.createUser(dto).then((data) => ({ data }));
  }

  @Post('upload-avatar')
  @RequirePermission('users', 'create')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarStorage,
      fileFilter: avatarFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
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

  // Picker list — must precede :id so "options" isn't parsed as a uuid.
  @Get('options')
  @RequirePermission('users', 'read')
  async listUserOptions(@Req() req: AuthenticatedRequest) {
    return { data: await this.users.listUserOptions(req.user) };
  }

  @Get()
  @RequirePermission('users', 'read')
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const { data, meta } = await this.users.listUsers(query, req.user);
    return { data, meta };
  }

  @Get(':id')
  @RequirePermission('users', 'read')
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return { data: { user: await this.users.getUserById(id, req.user) } };
  }

  @Patch(':id')
  @RequirePermission('users', 'update')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return {
      data: { user: await this.users.updateUser(id, dto, req.user) },
    };
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.users.deleteUser(id, req.user);
    return { data: { message: 'User deleted' } };
  }
}
