import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Step } from './entities/step.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Injectable()
export class StepsService {
  constructor(
    @InjectRepository(Step)
    private stepRepository: Repository<Step>,

    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
  ) {}

  async create(data: any) {
    const recipe = await this.recipeRepository.findOne({
      where: { id: data.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const step = this.stepRepository.create({
      description: data.description,
      order: data.order,
      image_url: data.image_url,
      recipe,
    });

    return this.stepRepository.save(step);
  }

  async findAll() {
    return this.stepRepository.find({
      relations: ['recipe'],
    });
  }

  async findByRecipeId(recipeId: number) {
    return this.stepRepository.find({
      where: {
        recipe: { id: recipeId },
      },
      order: {
        order: 'ASC',
        id: 'ASC',
      },
    });
  }

  async findOne(id: number) {
    const step = await this.stepRepository.findOne({
      where: { id },
    });

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    return step;
  }

  async remove(id: number) {
    const step = await this.findOne(id);

    await this.stepRepository.remove(step);

    return { message: 'Step deleted' };
  }

  async removeByRecipeId(recipeId: number) {
    const steps = await this.stepRepository.find({
      where: {
        recipe: { id: recipeId },
      },
    });

    await this.stepRepository.remove(steps);

    return {
      message: `All steps for recipe ${recipeId} deleted`,
      count: steps.length,
    };
  }
}