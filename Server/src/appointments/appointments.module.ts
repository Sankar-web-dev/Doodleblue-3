import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { MailerService } from '../mail/mailer.service.js';


@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, MailerService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
