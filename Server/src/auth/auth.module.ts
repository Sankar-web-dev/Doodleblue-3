import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';
import { RequirePasswordChangedGuard } from './require-password-changed.guard.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard,
    PermissionsGuard,
    RequirePasswordChangedGuard,
  ],
  exports: [AuthService, AuthGuard, PermissionsGuard, RequirePasswordChangedGuard],
})
export class AuthModule {}
