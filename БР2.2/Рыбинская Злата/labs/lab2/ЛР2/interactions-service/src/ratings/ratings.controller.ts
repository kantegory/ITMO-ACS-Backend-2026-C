import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth,   ApiOperation } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('recipes')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/rating')
  @ApiOperation({ summary: 'Поставить рейтинг рецепту' })
  create(
    @Request() req,
    @Param('id') id: string,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create({
      ...createRatingDto,
      recipeId: parseInt(id, 10),
      userId: req.user.userId,
    });
  }

  @Get(':id/rating/:ratingId')
  @ApiOperation({ summary: 'Получить рейтинг по айди' })
  findOne(@Param('ratingId') ratingId: string) {
    return this.ratingsService.findOne(+ratingId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/rating/:ratingId')
  @ApiOperation({ summary: 'Полностью обновить рейтинг рецепта' })
  update(
    @Request() req,
    @Param('ratingId') ratingId: string,
    @Body() updateRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.update(
      +ratingId,
      {
        ...updateRatingDto,
        userId: req.user.userId,
      },
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/rating/:ratingId')
  @ApiOperation({ summary: 'Удалить рейтинг рецепта' })
  remove(
    @Request() req,
    @Param('ratingId') ratingId: string,
  ) {
    return this.ratingsService.remove(+ratingId);
  }
}