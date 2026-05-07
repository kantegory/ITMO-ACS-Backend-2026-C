import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Like } from './entities/like.entity';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,

    @Inject('RECIPES_SERVICE')
    private recipesClient: ClientProxy,
  ) {}

  async countByRecipe(recipeId: number) {
    console.log(recipeId);
    return this.likeRepository.count({
      where: {
        recipe: recipeId,
      },
    });
  }

  async addLike(user: number, recipe: number) {
    const exists = await firstValueFrom(
    this.recipesClient.send('check_recipe_exists', { recipe }),
    );

    console.log(recipe);
    console.log(exists);
    if (!exists) {
      throw new NotFoundException('Recipe not found');
    }
    const existing = await this.likeRepository.findOne({
      where: { user, recipe },
    });

    if (existing) {
      throw new ConflictException('Лайк уже поставлен');
    }

    const like = this.likeRepository.create({
      user,
      recipe,
    });

    return this.likeRepository.save(like);
  }

  async removeLike(user: number, recipe: number) {
    const like = await this.likeRepository.findOne({
      where: { user, recipe },
    });

    if (!like) {
      throw new NotFoundException('Лайк не найден');
    }

    await this.likeRepository.remove(like);

    return { message: 'Лайк удалён' };
  }
}