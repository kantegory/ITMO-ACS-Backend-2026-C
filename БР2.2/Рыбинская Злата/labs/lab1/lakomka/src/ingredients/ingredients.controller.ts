import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  create(@Body() createIngredientDto: any) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(+id);
  }
}

@Controller('recipes')
export class RecipeIngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get(':id/ingredients')
  getRecipeIngredients(@Param('id') id: string) {
    return this.ingredientsService.findByRecipeId(+id);
  }

  @Post(':id/ingredients')
  addToRecipe(@Param('id') id: string, @Body() body: any) {
    return this.ingredientsService.addToRecipe(+id, body);
  }

  @Patch(':id/ingredients/:ingredientId')
  updateInRecipe(
    @Param('id') id: string,
    @Param('ingredientId') ingredientId: string,
    @Body() body: any
  ) {
    return this.ingredientsService.updateInRecipe(+id, +ingredientId, body);
  }

  @Delete(':id/ingredients/:ingredientId')
  removeFromRecipe(
    @Param('id') id: string,
    @Param('ingredientId') ingredientId: string
  ) {
    return this.ingredientsService.removeFromRecipe(+id, +ingredientId);
  }
}