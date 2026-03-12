import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class CreateChatDto {
    @Type(() => Number)
    @IsInt()
    user1Id: number;

    @Type(() => Number)
    @IsInt()
    user2Id: number;
}

export class CreateMessageDto {
    @IsString()
    @Type(() => String)
    text: string;

    @Type(() => Number)
    @IsInt()
    sentBy: number;
}

export class UpdateMessageDto {
    @IsString()
    @Type(() => String)
    text: string;
}
