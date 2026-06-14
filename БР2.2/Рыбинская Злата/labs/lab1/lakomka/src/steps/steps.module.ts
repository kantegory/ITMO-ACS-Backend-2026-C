import { Module } from '@nestjs/common';
import { StepsService } from './steps.service';
import { StepsController } from './steps.controller';

@Module({
  controllers: [StepsController],
  providers: [StepsService],
})
export class StepsModule {}
