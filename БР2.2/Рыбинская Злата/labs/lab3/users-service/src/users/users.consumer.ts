import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersConsumer {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('get_user')
  async getUser(data: { userId: number }) {
    console.log('ПРИШЛО В USERS SERVICE:', data);
    console.log('Полный паттерн:', 'get_user');
    
    const result = await this.usersService.findOne(data.userId);
    console.log('Результат:', result);
    
    return result;
  }
}