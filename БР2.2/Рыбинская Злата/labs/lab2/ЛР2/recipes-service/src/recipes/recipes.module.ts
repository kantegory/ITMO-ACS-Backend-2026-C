import { Module } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RecipesConsumer } from './recipe.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe]),
  ClientsModule.register([
    {
      name: 'USERS_SERVICE',
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://localhost:5672'],
        queue: 'users_queue',
        queueOptions: { durable: false },
        prefetchCount: 1,
      },
    },
  ]),
  ClientsModule.register([
  {
    name: 'INTERACTIONS_SERVICE',
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'interactions_queue',
      queueOptions: {
        durable: false,
      },
    },
  },
])
],
  controllers: [RecipesController, RecipesConsumer],
  providers: [RecipesService],
})
export class RecipesModule {}
