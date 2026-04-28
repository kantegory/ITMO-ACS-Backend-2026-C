import { Module } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating])],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}