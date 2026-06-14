import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class CommentsService {
  private comments: any[] = [];

  create(createCommentDto: any) {
    const comment = {
      id: this.comments.length + 1,
      ...createCommentDto,
      createdAt: new Date()
    };

    this.comments.push(comment);
    return comment;
  }

  findAll() {
    return this.comments;
  }

  findByRecipeId(recipeId: number) {
    return this.comments.filter(comment => comment.recipeId === recipeId);
  }

  findOne(id: number) {
    const comment = this.comments.find(c => c.id === id);
    
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    
    return comment;
  }

  update(id: number, updateCommentDto: any) {
    const index = this.comments.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    this.comments[index] = {
      ...this.comments[index],
      ...updateCommentDto,
      updatedAt: new Date()
    };

    return this.comments[index];
  }

  remove(id: number) {
    const index = this.comments.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    const removed = this.comments.splice(index, 1);
    return { message: 'Comment removed', comment: removed[0] };
  }
}