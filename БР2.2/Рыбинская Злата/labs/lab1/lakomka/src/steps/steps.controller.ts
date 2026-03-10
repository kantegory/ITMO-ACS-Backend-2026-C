import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { StepsService } from './steps.service';

@Controller('recipes')
export class StepsController {
  constructor(private readonly stepsService: StepsService) {}

  @Get(':id/steps')
  findByRecipeId(@Param('id') id: string) {
    return this.stepsService.findByRecipeId(+id);
  }

  @Post(':id/steps')
  create(@Param('id') id: string, @Body() createStepDto: any) {
    return this.stepsService.create({
      ...createStepDto,
      recipeId: +id
    });
  }

  @Get(':id/steps/:stepId')
  findOne(@Param('stepId') stepId: string) {
    return this.stepsService.findOne(+stepId);
  }

  @Delete(':id/steps/:stepId')
  remove(@Param('stepId') stepId: string) {
    return this.stepsService.remove(+stepId);
  }

  @Delete(':id/steps')
  removeByRecipeId(@Param('id') id: string) {
    return this.stepsService.removeByRecipeId(+id);
  }
}