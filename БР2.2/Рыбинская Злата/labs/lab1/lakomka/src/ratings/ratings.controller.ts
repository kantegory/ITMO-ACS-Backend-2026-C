import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RatingsService } from './ratings.service';

@Controller('recipes')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post(':id/rating')
  create(@Param('id') id: string, @Body() createRatingDto: any) {
    return this.ratingsService.create({
      ...createRatingDto,
      recipeId: +id
    });
  }

  @Get(':id/rating')
  findAll(@Param('id') id: string) {
    const allRatings = this.ratingsService.findAll();
    return allRatings.filter(r => r.recipeId === +id);
  }

  @Get(':id/rating/:ratingId')
  findOne(@Param('ratingId') ratingId: string) {
    return this.ratingsService.findOne(+ratingId);
  }

  @Patch(':id/rating/:ratingId')
  update(@Param('ratingId') ratingId: string, @Body() updateRatingDto: any) {
    return this.ratingsService.update(+ratingId, updateRatingDto);
  }

  @Delete(':id/rating/:ratingId')
  remove(@Param('ratingId') ratingId: string) {
    return this.ratingsService.remove(+ratingId);
  }
}