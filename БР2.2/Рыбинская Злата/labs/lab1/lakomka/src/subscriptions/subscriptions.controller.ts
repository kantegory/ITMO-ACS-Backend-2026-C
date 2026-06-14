import { Controller, Get, Post, Body, Delete, Param, BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

class SubscribeDto {
  targetId: number;
}

@ApiTags('subscriptions')
@Controller('users')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post(':userId/subscribe')
  @ApiOperation({ summary: 'Подписаться на автора' })
  @ApiParam({ name: 'userId', type: 'number', description: 'ID пользователя' })
  @ApiBody({ 
    type: SubscribeDto,
    examples: {
      example1: {
        value: {
          targetId: 2
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Успешная подписка' })
  @ApiResponse({ status: 400, description: 'targetId обязателен' })
  subscribe(@Param('userId') userId: string, @Body() body: any) {
    if (!body || !body.targetId) {
      throw new BadRequestException('targetId is required');
    }

    return this.subscriptionsService.subscribe({
      userId: +userId,
      targetId: body.targetId,
    });
  }
}