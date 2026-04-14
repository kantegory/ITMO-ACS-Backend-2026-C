import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { AddIngredientToRecipeDto } from './dto/create-ingredient.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiOperation({ summary: 'Создать ингредиент' })
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все ингредиенты' })
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить ингредиент по айди' })
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить ингредиент по айди' })
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(+id);
  }
}

@Controller('recipes')
export class RecipeIngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get(':id/ingredients')
  @ApiOperation({ summary: 'Получить ингредиенты рецепта' })
  getRecipeIngredients(@Param('id') id: string) {
    return this.ingredientsService.findByRecipeId(+id);
  }

  @Post(':id/ingredients')
  @ApiOperation({ summary: 'Привязать ингредиент к рецепту' })
  addToRecipe(
    @Param('id') id: string,
    @Body() dto: AddIngredientToRecipeDto,
  ) {
    return this.ingredientsService.addToRecipe(+id, dto);
  }

  @Delete(':id/ingredients/:ingredientId')
  @ApiOperation({ summary: 'Отвязать ингредиент от рецепта' })
  removeFromRecipe(
    @Param('id') id: string,
    @Param('ingredientId') ingredientId: string
  ) {
    return this.ingredientsService.removeFromRecipe(+id, +ingredientId);
  }
}