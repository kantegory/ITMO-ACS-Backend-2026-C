import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,

    @Inject('USERS_SERVICE')
    private usersClient: ClientProxy,
  ) {}

  async getUserName(userId: number) {
    const user = await firstValueFrom(
      this.usersClient.send('get_user', { userId }),
    );

    return user.name;
  }

  async create(createCommentDto: any) {
    const comment = this.commentRepository.create({
      description: createCommentDto.description,
      recipeId: createCommentDto.recipeId,
      userId: createCommentDto.userId,
    });

    return this.commentRepository.save(comment);
  }

  async findAll() {
    return this.commentRepository.find();
  }

  async findOne(id: number) {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    let userName = 'unknown';

    try {
      const user = await firstValueFrom(
        this.usersClient.send('get_user', { userId: comment.userId }),
      );

      userName = user.name;
    } catch {}

    return {
      ...comment,
      userName,
    };
  }

  async update(id: number, updateCommentDto: any) {
    const comment = await this.findOne(id);

    return this.commentRepository.save({
      ...comment,
      ...updateCommentDto,
    });
  }

  async remove(id: number) {
    const comment = await this.findOne(id);

    await this.commentRepository.remove(comment);

    return {
      message: 'Comment removed',
      comment,
    };
  }
}