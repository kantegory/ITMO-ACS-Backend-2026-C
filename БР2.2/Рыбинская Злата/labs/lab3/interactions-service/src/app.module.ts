import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RatingsModule  } from './ratings/ratings.module';
import { LikesModule  } from './likes/likes.module';
import { CommentsModule  } from './comments/comments.module';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? '1234',
      database: process.env.DB_DATABASE ?? 'lakomka_interactions',
      autoLoadEntities: true,
      synchronize: true,
}),
  RatingsModule,
  LikesModule,
  CommentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
