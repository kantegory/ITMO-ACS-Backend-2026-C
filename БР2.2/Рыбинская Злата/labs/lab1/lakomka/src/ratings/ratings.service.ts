import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class RatingsService {
  private ratings: any[] = [];

  create(data: any) {
    const rating = {
      id: this.ratings.length + 1,
      ...data,
      createdAt: new Date()
    };

    this.ratings.push(rating);
    return rating;
  }

  findAll() {
    return this.ratings;
  }

  findOne(id: number) {
    const rating = this.ratings.find(r => r.id === id);
    
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }
    
    return rating;
  }

  update(id: number, data: any) {
    const index = this.ratings.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    this.ratings[index] = {
      ...this.ratings[index],
      ...data,
      updatedAt: new Date()
    };

    return this.ratings[index];
  }

  remove(id: number) {
    const index = this.ratings.findIndex(r => r.id === id);

    if (index === -1) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    const removed = this.ratings.splice(index, 1);
    return { message: 'Rating removed', rating: removed[0] };
  }
}