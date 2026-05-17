import { ApiProperty } from '@nestjs/swagger';

export class CreateRecipeDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  img_url: string;

  @ApiProperty()
  cook_time: string;

  @ApiProperty()
  difficulty_id: number;

  @ApiProperty()
  type_id: number;
}