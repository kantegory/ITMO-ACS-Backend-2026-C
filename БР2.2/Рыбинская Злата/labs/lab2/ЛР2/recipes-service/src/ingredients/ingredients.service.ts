import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Ingredient } from './entities/ingredient.entity';
import { RecipeIngredient } from './entities/recipeIngredient.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,

    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,

    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
  ) {}

  async create(data: any) {
    const ingredient = this.ingredientRepository.create(data);
    return this.ingredientRepository.save(ingredient);
  }

  async findAll() {
    return this.ingredientRepository.find();
  }

  async findOne(id: number) {
    const ingredient = await this.ingredientRepository.findOne({
      where: { id },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    return ingredient;
  }

  async remove(id: number) {
    const ingredient = await this.findOne(id);
    await this.ingredientRepository.remove(ingredient);

    return { message: 'Ingredient deleted' };
  }

  // --- связь с рецептом ---

  async addToRecipe(recipeId: number, data: any) {
    const recipe = await this.recipeRepository.findOne({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const ingredient = await this.ingredientRepository.findOne({
      where: { id: data.ingredientId },
    });

    if (!ingredient) {
      throw new NotFoundException('Ingredient not found');
    }

    const relation = this.recipeIngredientRepository.create({
      recipe,
      ingredient,
      amount: data.amount,
      unit: data.unit,
    });

    return this.recipeIngredientRepository.save(relation);
  }

  async findByRecipeId(recipeId: number) {
    return this.recipeIngredientRepository.find({
      where: {
        recipe: { id: recipeId },
      },
      relations: ['ingredient'],
    });
  }

  async removeFromRecipe(recipeId: number, ingredientId: number) {
    const relation = await this.recipeIngredientRepository.findOne({
      where: {
        recipe: { id: recipeId },
        ingredient: { id: ingredientId },
      },
    });

    if (!relation) {
      throw new NotFoundException('Relation not found');
    }

    await this.recipeIngredientRepository.remove(relation);

    return { message: 'Ingredient removed from recipe' };
  }

  async updateInRecipe(recipeId: number, ingredientId: number, data: any) {
    const relation = await this.recipeIngredientRepository.findOne({
      where: {
        recipe: { id: recipeId },
        ingredient: { id: ingredientId },
      },
      relations: ['ingredient'],
    });

    if (!relation) {
      throw new NotFoundException('Relation not found');
    }

    const updated = await this.recipeIngredientRepository.save({
      ...relation,
      ...data,
    });

    return updated;
  }
}