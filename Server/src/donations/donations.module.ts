import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller.js';
import { DonationsService } from './donations.service.js';
import { MailerService } from '../mail/mailer.service.js';


@Module({
  controllers: [DonationsController],
  providers: [DonationsService, MailerService],
  exports: [DonationsService],
})
export class DonationsModule {}
