import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { RolesModule } from './roles/roles.module.js';
import { ProfilesModule } from './profiles/profiles.module.js';
import { RequestsModule } from './requests/requests.module.js';
import { ResponsesModule } from './responses/responses.module.js';
import { DonationsModule } from './donations/donations.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { AuditModule } from './audit/audit.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { EnvelopeInterceptor } from './common/envelope.interceptor.js';

import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ProfilesModule,
    RequestsModule,
    ResponsesModule,
    DonationsModule,
    AppointmentsModule,
    NotificationsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: EnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
