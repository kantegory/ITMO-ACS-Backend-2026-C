import { IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiMessageStatus } from '../chat/dto';

export class UpdateMessageDto {
    @IsString()
    @Length(1, 10000)
    @Type(() => String)
    text: string;
}

export class MessageResponseDto {
    id: number;
    createdAt: Date;
    text: string;
    sentBy: number;
    status: ApiMessageStatus;
    edited: boolean;
    chatId: number;
}

export class ErrorResponseDto {
    message: string;
    code: string;
}
