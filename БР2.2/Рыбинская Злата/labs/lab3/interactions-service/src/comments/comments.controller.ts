import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth,  ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('recipes')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiOperation({ summary: 'Опубликовать коментарий' })
  create(
    @Request() req,
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create({
      ...createCommentDto,
      recipeId: parseInt(id, 10),
      userId: req.user.userId,
    });
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Получить коментарий по айди' })
  findByRecipeId(@Param('id') id: string) {
    return this.commentsService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Удалить коментарий' })
  remove(
    @Request() req,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.remove(+commentId);
  }
}