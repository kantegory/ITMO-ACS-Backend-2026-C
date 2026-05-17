import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Rating } from './entities/rating.entity';
import {
  ConflictException,
} from '@nestjs/common';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
  ) {}

  async create(data: any) {
    const existing = await this.ratingRepository.findOne({
      where: { userId: data.userId, recipeId: data.recipeId },
    });

    if (existing) {
      throw new ConflictException('Рейтинг уже поставлен');
    }

    const rating = this.ratingRepository.create({
      value: data.value,
      recipeId: data.recipeId,
      userId: data.userId,
    });

    return this.ratingRepository.save(rating);
  }

  async findAll() {
    return this.ratingRepository.find();
  }

  async findOne(id: number) {
    const rating = await this.ratingRepository.findOne({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    return rating;
  }

  async update(id: number, data: any) {
    const rating = await this.findOne(id);

    return this.ratingRepository.save({
      ...rating,
      ...data,
    });
  }

  async remove(id: number) {
    const rating = await this.findOne(id);

    await this.ratingRepository.remove(rating);

    return {
      message: 'Rating removed',
      rating,
    };
  }
}