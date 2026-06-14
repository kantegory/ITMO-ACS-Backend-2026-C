import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class LikesService {
  private likes: any[] = [];

  addLike(data: any) {
    const like = {
      id: this.likes.length + 1,
      ...data
    };

    this.likes.push(like);
    return like;
  }

  removeLikeByRecipeId(recipeId: number) {
    const likeIndex = this.likes.findIndex(like => like.recipeId === recipeId);

    if (likeIndex === -1) {
      throw new NotFoundException(`Like for recipe with ID ${recipeId} not found`);
    }

    this.likes.splice(likeIndex, 1);
    return { message: 'Like removed' };
  }
}