import { ApiProperty } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty()
  name: string;
}

export class AddIngredientToRecipeDto {
  @ApiProperty()
  ingredientId: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  unit: string;
}