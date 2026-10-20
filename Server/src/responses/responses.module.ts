import { Module } from '@nestjs/common';
import { ResponsesController } from './responses.controller.js';
import { ResponsesService } from './responses.service.js';
import { MailerService } from '../mail/mailer.service.js';

@Module({
  controllers: [ResponsesController],
  providers: [ResponsesService, MailerService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
