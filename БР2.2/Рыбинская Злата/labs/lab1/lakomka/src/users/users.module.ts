import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthController } from './users.controller';

@Module({
  controllers: [UsersController, AuthController],
  providers: [UsersService],
})
export class UsersModule {}
