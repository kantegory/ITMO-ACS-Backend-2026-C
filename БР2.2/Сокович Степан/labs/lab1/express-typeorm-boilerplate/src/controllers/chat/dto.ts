import { IsInt, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatResponseDto {
    id: string;
    createdAt: Date;
    user1Id: string;
    user2Id: string;
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
    id: string;
    createdAt: Date;
    text: string;
    sentBy: string;
    status: string;
    edited: boolean;
    chatId: string;
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
