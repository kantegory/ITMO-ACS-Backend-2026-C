import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { LikesConsumer } from './likes.consumer';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [TypeOrmModule.forFeature([Like]),
  ClientsModule.register([
    {
      name: 'RECIPES_SERVICE',
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'recipes_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  ])
  ],
  controllers: [LikesController, LikesConsumer],
  providers: [LikesService],
})
export class LikesModule {}
