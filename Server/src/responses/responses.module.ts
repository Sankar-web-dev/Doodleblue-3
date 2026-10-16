import { Module } from '@nestjs/common';
import { ResponsesController } from './responses.controller.js';
import { ResponsesService } from './responses.service.js';

@Module({
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
