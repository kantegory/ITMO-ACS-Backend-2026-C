import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  Get
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('likes')
@ApiBearerAuth()
@Controller('recipes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiOperation({ summary: 'Поставить лайк рецепту' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID рецепта' })
  @ApiResponse({ status: 201, description: 'Лайк поставлен' })
  @ApiResponse({ status: 409, description: 'Лайк уже существует' })
  addLike(@Request() req, @Param('id') id: string) {
    const recipeId = parseInt(id, 10);
    return this.likesService.addLike(req.user.userId, recipeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  @ApiOperation({ summary: 'Убрать лайк с рецепта' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID рецепта' })
  @ApiResponse({ status: 200, description: 'Лайк удалён' })
  removeLike(@Request() req, @Param('id') id: string) {
    return this.likesService.removeLike(
      req.user.userId,
      +id,
    );
  }

}