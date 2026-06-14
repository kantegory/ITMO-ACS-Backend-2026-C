import { IsString, IsArray, IsNumber, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMessageDto {
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    @Type(() => String)
    text: string;
}

export class MarkMessagesReadDto {
    @IsArray()
    @IsNumber({}, { each: true })
    messageIds: number[];
}
