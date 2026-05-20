import { IsOptional, IsString } from 'class-validator';

export class MyMessagesQueryDto {
    @IsOptional()
    @IsString()
    search?: string;
}