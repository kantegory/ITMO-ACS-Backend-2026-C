import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('recipes')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post(':id/comments')
  create(@Param('id') id: string, @Body() createCommentDto: any) {
    return this.commentsService.create({
      ...createCommentDto,
      recipeId: +id
    });
  }

  @Get(':id/comments')
  findByRecipeId(@Param('id') id: string) {
    return this.commentsService.findByRecipeId(+id);
  }

  @Get(':id/comments/:commentId')
  findOne(@Param('commentId') commentId: string) {
    return this.commentsService.findOne(+commentId);
  }

  @Patch(':id/comments/:commentId')
  update(@Param('commentId') commentId: string, @Body() updateCommentDto: any) {
    return this.commentsService.update(+commentId, updateCommentDto);
  }

  @Delete(':id/comments/:commentId')
  remove(@Param('commentId') commentId: string) {
    return this.commentsService.remove(+commentId);
  }
}