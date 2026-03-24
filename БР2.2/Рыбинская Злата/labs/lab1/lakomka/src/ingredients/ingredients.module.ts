import { Module } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { RecipeIngredientsController } from './ingredients.controller';

@Module({
  controllers: [IngredientsController, RecipeIngredientsController],
  providers: [IngredientsService],
})
export class IngredientsModule {}
