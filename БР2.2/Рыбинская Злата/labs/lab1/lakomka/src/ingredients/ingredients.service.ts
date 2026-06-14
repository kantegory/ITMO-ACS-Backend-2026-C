import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class IngredientsService {
  private ingredients: any[] = [];
  private recipeIngredients: any[] = [];

  create(data: any) {
    const ingredient = {
      id: this.ingredients.length + 1,
      ...data,
      createdAt: new Date()
    };

    this.ingredients.push(ingredient);
    return ingredient;
  }

  findAll() {
    return this.ingredients;
  }

  findOne(id: number) {
    const ingredient = this.ingredients.find(i => i.id === id);

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }

    return ingredient;
  }

  remove(id: number) {
    const index = this.ingredients.findIndex(i => i.id === id);

    if (index === -1) {
      throw new NotFoundException(`Ingredient with ID ${id} not found`);
    }

    this.recipeIngredients = this.recipeIngredients.filter(
      ri => ri.ingredientId !== id
    );

    this.ingredients.splice(index, 1);
    return { message: 'Ingredient deleted' };
  }

  addToRecipe(recipeId: number, data: any) {
    const ingredient = this.ingredients.find(i => i.id === data.ingredientId);
    if (!ingredient) {
      throw new NotFoundException(`Ingredient with ID ${data.ingredientId} not found`);
    }

    const recipeIngredient = {
      id: this.recipeIngredients.length + 1,
      recipeId,
      ...data,
      createdAt: new Date()
    };

    this.recipeIngredients.push(recipeIngredient);

    return {
      ...recipeIngredient,
      ingredient
    };
  }

  findByRecipeId(recipeId: number) {
    const recipeIngredients = this.recipeIngredients.filter(
      ri => ri.recipeId === recipeId
    );
    return recipeIngredients.map(ri => ({
      ...ri,
      ingredient: this.ingredients.find(i => i.id === ri.ingredientId)
    }));
  }


  removeFromRecipe(recipeId: number, ingredientId: number) {
    const index = this.recipeIngredients.findIndex(
      ri => ri.recipeId === recipeId && ri.ingredientId === ingredientId
    );

    if (index === -1) {
      throw new NotFoundException(
        `Ingredient ${ingredientId} not found in recipe ${recipeId}`
      );
    }

    this.recipeIngredients.splice(index, 1);
    return { message: 'Ingredient removed from recipe' };
  }

  updateInRecipe(recipeId: number, ingredientId: number, data: any) {
    const recipeIngredient = this.recipeIngredients.find(
      ri => ri.recipeId === recipeId && ri.ingredientId === ingredientId
    );

    if (!recipeIngredient) {
      throw new NotFoundException(
        `Ingredient ${ingredientId} not found in recipe ${recipeId}`
      );
    }

    Object.assign(recipeIngredient, data, { updatedAt: new Date() });
    return {
      ...recipeIngredient,
      ingredient: this.ingredients.find(i => i.id === ingredientId)
    };
  }
}