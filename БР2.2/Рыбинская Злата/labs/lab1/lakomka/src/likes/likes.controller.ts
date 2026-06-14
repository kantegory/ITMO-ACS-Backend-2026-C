import { Controller, Post, Delete, Param } from '@nestjs/common';
import { LikesService } from './likes.service';

@Controller('recipes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  addLike(@Param('id') id: string) {
    return this.likesService.addLike({ recipeId: +id });
  }

  @Delete(':id/like')
  removeLike(@Param('id') id: string) {
    return this.likesService.removeLikeByRecipeId(+id);
  }
}