import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class StepsService {
  private steps: any[] = [];

  create(data: any) {
    const step = {
      id: this.steps.length + 1,
      ...data,
      createdAt: new Date()
    };

    this.steps.push(step);
    return step;
  }

  findAll() {
    return this.steps;
  }

  findByRecipeId(recipeId: number) {
    return this.steps
      .filter(s => s.recipeId === recipeId)
      .sort((a, b) => (a.stepNumber || a.id) - (b.stepNumber || b.id));
  }

  findOne(id: number) {
    const step = this.steps.find(s => s.id === id);

    if (!step) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    return step;
  }

  remove(id: number) {
    const index = this.steps.findIndex(s => s.id === id);

    if (index === -1) {
      throw new NotFoundException(`Step with ID ${id} not found`);
    }

    this.steps.splice(index, 1);
    return { message: 'Step deleted' };
  }

  removeByRecipeId(recipeId: number) {
    const stepsToRemove = this.steps.filter(s => s.recipeId === recipeId);
    this.steps = this.steps.filter(s => s.recipeId !== recipeId);
    
    return { 
      message: `All steps for recipe ${recipeId} deleted`,
      count: stepsToRemove.length 
    };
  }
}