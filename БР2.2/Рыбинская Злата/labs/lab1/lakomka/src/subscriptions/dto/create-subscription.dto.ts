import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ 
    description: 'ID автора, на которого подписываемся',
    example: 2 
  })
  targetId: number;
}