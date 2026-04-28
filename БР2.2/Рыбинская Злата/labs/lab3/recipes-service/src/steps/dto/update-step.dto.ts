import { PartialType } from '@nestjs/swagger';
import { CreateStepDto } from './create-step.dto';

export class UpdateStepDto extends PartialType(CreateStepDto) {}
