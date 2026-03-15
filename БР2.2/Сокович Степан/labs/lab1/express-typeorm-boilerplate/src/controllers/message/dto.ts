import { IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageStatus } from '../../models/message.entity';

export class UpdateMessageDto {
    @IsString()
    @Length(1, 10000)
    @Type(() => String)
    text: string;
}

export class MessageResponseDto {
    id: string;
    createdAt: Date;
    text: string;
    sentBy: string;
    status: MessageStatus;
    edited: boolean;
    chatId: string;
}

export class ErrorResponseDto {
    message: string;
    code: string;
}
