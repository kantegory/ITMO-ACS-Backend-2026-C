import { ApiProperty } from '@nestjs/swagger';

export class CreateStepDto {
  @ApiProperty()
  description: string;

  @ApiProperty()
  recipe: number;

  @ApiProperty({ required: false })
  order: number;
}