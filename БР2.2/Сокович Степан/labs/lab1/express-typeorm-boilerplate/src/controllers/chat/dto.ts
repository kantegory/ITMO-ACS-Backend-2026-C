import { IsInt, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ApiMessageStatus {
    SENT = 'отправлено',
    RECEIVED = 'получено',
    READ = 'прочитано',
}

export class ChatResponseDto {
    id: number;
    createdAt: Date;
    user1Id: number;
    user2Id: number;
}

export class ChatsListResponseDto {
    data: ChatResponseDto[];
}

export class CreateChatDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    user1Id: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    user2Id: number;
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

export class MessagesListResponseDto {
    data: MessageResponseDto[];
}

export class CreateMessageDto {
    @IsString()
    @Length(1, 10000)
    @Type(() => String)
    text: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    sentBy: number;
}

export class ErrorResponseDto {
    message: string;
    code: string;
}
