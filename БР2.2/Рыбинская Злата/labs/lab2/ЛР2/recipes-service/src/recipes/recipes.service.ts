import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';



@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,

    @Inject('USERS_SERVICE')
    private client: ClientProxy,

    @Inject('INTERACTIONS_SERVICE')
    private int_client: ClientProxy,
  ) {}

  async exists(recipeId: number): Promise<boolean> {
    console.log(recipeId);
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });

    console.log(recipe);
    return !!recipe;
  }

  async getLikesCount(recipeId: number) {
    return await firstValueFrom(
      this.int_client.send('get_likes_count', { recipeId }),
    );
  }

  async getAuthor(userId: number) {
    try {

      const res = await firstValueFrom(
        this.client.send('get_user', { userId }),
      );

      console.log('AUTHOR:', res); // ← добавь
      return res;

    } catch (e) {
      console.log('ERROR RMQ:', e); // ← ВАЖНО
      throw e;
    }
  }

  async findByAuthor(authorId: number) {
    return this.recipeRepository.find({
      where: { authorId },
    });
  }

  async create(data: CreateRecipeDto & { authorId: number }) {
    const recipe = this.recipeRepository.create(data);
    return this.recipeRepository.save(recipe);
  }

  async findAll(query: any) {
    const qb = this.recipeRepository.createQueryBuilder('recipe');

    if (query.type_id) {
      qb.andWhere('recipe.type_id = :type_id', {
        type_id: Number(query.type_id),
      });
    }

    if (query.difficulty_id) {
      qb.andWhere('recipe.difficulty_id = :difficulty_id', {
        difficulty_id: Number(query.difficulty_id),
      });
    }

    if (query.search) {
      qb.andWhere('LOWER(recipe.name) LIKE LOWER(:search)', {
        search: `%${query.search}%`,
      });
    }

    if (query.sort_by) {
      const order = query.order === 'desc' ? 'DESC' : 'ASC';

      if (query.sort_by === 'rating') {
        qb.orderBy('recipe.rating', order);
      } else if (query.sort_by === 'created_at') {
        qb.orderBy('recipe.created_at', order);
      } else if (query.sort_by === 'difficulty') {
        qb.orderBy('recipe.difficulty_id', order);
      } else if (query.sort_by === 'name') {
        qb.orderBy('recipe.name', order);
      }
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id },
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }

      console.log('recipe:', recipe);

      let likesCount = 0;

      try {
        likesCount = await this.getLikesCount(recipe.id);
      } catch (e) {
        likesCount = 0;
        console.log(e);
      }

      console.log(likesCount);
      const author = await this.getAuthor(recipe.authorId);
      console.log(author.name);
      let name_auth = author.name

      return {
        ...recipe,
        name_auth,
        likesCount,
      };
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async update(id: number, updateRecipeDto: UpdateRecipeDto) {
    const recipe = await this.findOne(id);

    const updated = await this.recipeRepository.save({
      ...recipe,
      ...updateRecipeDto,
    });

    return updated;
  }

  async remove(id: number) {
    const recipe = await this.findOne(id);

    await this.recipeRepository.remove(recipe);

    return {
      message: 'Recipe deleted',
    };
  }
}