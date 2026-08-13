import { IsNumber } from 'class-validator';

export class CreateSessionDto {
    @IsNumber()
    user_id: number;
}
