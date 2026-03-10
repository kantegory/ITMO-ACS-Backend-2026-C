import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {

  private recipes: any[] = [];

  create(createRecipeDto: CreateRecipeDto) {
    const recipe = {
      id: this.recipes.length + 1,
      ...createRecipeDto,
      created_at: new Date()
    };

    this.recipes.push(recipe);
    return recipe;
  }

  findAll() {
    return this.recipes;
  }

  findOne(id: number) {
    const recipe = this.recipes.find(r => r.id === id);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe;
  }

  update(id: number, updateRecipeDto: UpdateRecipeDto) {
    const recipe = this.recipes.find(r => r.id === id);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    Object.assign(recipe, updateRecipeDto);

    return recipe;
  }

  remove(id: number) {
    const index = this.recipes.findIndex(r => r.id === id);

    if (index === -1) {
      throw new NotFoundException('Recipe not found');
    }

    this.recipes.splice(index, 1);

    return {
      message: 'Recipe deleted'
    };
  }
}