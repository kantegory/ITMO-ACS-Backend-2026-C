import { IsString, IsNumber, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConversationDto {
    @IsNumber()
    @Type(() => Number)
    userId: number;

    @IsNumber()
    @Type(() => Number)
    propertyId: number;

    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    @Type(() => String)
    message: string;
}
