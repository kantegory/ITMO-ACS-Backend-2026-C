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
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'lakomka_interactions',
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
