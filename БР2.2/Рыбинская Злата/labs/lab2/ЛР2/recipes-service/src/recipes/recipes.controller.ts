import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiQuery } from '@nestjs/swagger';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Создать рецепт' })
  create(
    @Request() req,
    @Body() createRecipeDto: CreateRecipeDto,
  ) {
    return this.recipesService.create({
      ...createRecipeDto,
      authorId: req.user.userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Получить все рецепты' })

  @ApiQuery({ name: 'type_id', required: false, type: Number })
  @ApiQuery({ name: 'difficulty_id', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sort_by', required: false, enum: ['created_at', 'difficulty', 'name'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })

  findAll(@Query() query: any) {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить рецепт по айди' })
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить рецепт по айди' })
  remove(@Param('id') id: string) {
    return this.recipesService.remove(+id);
  }
}
