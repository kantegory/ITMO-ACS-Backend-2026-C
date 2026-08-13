import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateMessageDto {
    @IsNumber()
    user_id: number;

    @IsNumber()
    session_id: number;

    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    attachment_file_path?: string;

    @IsOptional()
    @IsBoolean()
    is_reshared?: boolean;
}

export class UpdateMessageDto {
    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    attachment_file_path?: string;

    @IsOptional()
    @IsBoolean()
    is_reshared?: boolean;
}
