import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { StepsService } from './steps.service';
import { CreateStepDto } from './dto/create-step.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@Controller('recipes')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Get(':id/steps')
  @ApiOperation({ summary: 'Получить шаги рецепта по айди' })
  findByRecipeId(@Param('id') id: string) {
    return this.stepsService.findByRecipeId(+id);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Добавить шаг к рецепту по айди' })
  create(@Param('id') id: string, @Body() createStepDto: CreateStepDto) {
    return this.stepsService.create({
      ...createStepDto,
      recipeId: +id
    });
  }

  @Delete(':id/steps/:stepId')
  @ApiOperation({ summary: 'Удалить шаг по айди' })
  remove(@Param('stepId') stepId: string) {
    return this.stepsService.remove(+stepId);
  }

  @Delete(':id/steps')
  @ApiOperation({ summary: 'Удалить все шаги рецепта' })
  removeByRecipeId(@Param('id') id: string) {
    return this.stepsService.removeByRecipeId(+id);
  }
}