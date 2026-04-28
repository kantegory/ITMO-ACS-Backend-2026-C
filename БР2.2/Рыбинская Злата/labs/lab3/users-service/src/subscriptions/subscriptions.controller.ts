import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('users')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Подписаться на пользователя' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя для подписки' })
  @ApiResponse({ status: 201, description: 'Успешная подписка' })
  subscribe(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.subscribe(
      req.user.userId,
      +id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/subscribe')
  @ApiOperation({ summary: 'Отписаться от пользователя' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID пользователя' })
  unsubscribe(@Request() req, @Param('id') id: string) {
    return this.subscriptionsService.unsubscribe(
      req.user.userId,
      +id,
    );
  }
}