import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersConsumer } from './users.consumer';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [TypeOrmModule.forFeature([User]),
  ClientsModule.register([
    {
      name: 'RECIPES_SERVICE',
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'recipe_queue',
        queueOptions: { durable: false },
        prefetchCount: 1,
      },
    },
  ]),
],
  controllers: [UsersController, AuthController, UsersConsumer],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
