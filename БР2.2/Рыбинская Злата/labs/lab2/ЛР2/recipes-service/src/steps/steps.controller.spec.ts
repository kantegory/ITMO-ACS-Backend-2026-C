import { Test, TestingModule } from '@nestjs/testing';
import { StepsController } from './steps.controller';
import { StepsService } from './steps.service';

describe('StepsController', () => {
  let controller: StepsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StepsController],
      providers: [StepsService],
    }).compile();

    controller = module.get<StepsController>(StepsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
