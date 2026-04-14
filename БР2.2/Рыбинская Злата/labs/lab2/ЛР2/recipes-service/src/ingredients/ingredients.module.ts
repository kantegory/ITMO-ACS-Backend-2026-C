import { Module } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { RecipeIngredientsController } from './ingredients.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { RecipeIngredient } from './entities/recipeIngredient.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient, RecipeIngredient, Recipe]),
  ],
  controllers: [IngredientsController, RecipeIngredientsController],
  providers: [IngredientsService],
})
export class IngredientsModule {}