import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { RecipesService } from './recipes.service';

@Controller()
export class RecipesConsumer {
  constructor(private readonly recipesService: RecipesService) {}

  @MessagePattern('get_recipes_by_user')
  async getRecipesByUser(data: { userId: number }) {
    console.log('RMQ get_recipes_by_user:', data);

    return this.recipesService.findByAuthor(data.userId);
  }

  @MessagePattern('check_recipe_exists')
  async checkRecipe(data: { recipe: number }) {
    console.log(data.recipe);
    return this.recipesService.exists(data.recipe);
  }
}