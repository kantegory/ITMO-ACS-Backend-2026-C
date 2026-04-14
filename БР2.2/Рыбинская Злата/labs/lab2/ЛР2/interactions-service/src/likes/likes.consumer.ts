import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { LikesService } from './likes.service';

@Controller()
export class LikesConsumer {
  constructor(private readonly likesService: LikesService) {}

@MessagePattern('get_likes_count')
async getLikesCount(data: { recipeId: number }) {
  console.log('LIKES SERVICE получил:', data);
  console.log('Паттерн: get_likes_count');
  
  const count = await this.likesService.countByRecipe(data.recipeId);
  console.log('Возвращаю count:', count);
  
  return count;
}
}