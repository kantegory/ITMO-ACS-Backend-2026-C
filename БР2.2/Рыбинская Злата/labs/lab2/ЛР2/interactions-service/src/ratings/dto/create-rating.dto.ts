import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDto {
  @ApiProperty()
  value: 'OPTIONAL' | 'GOOD' | 'AMAZING';
}