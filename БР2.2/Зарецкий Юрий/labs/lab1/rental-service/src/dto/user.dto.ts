import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Type(() => String)
    fullName?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    avatarUrl?: string;
}

export class ChangePasswordDto {
    @IsString()
    @Type(() => String)
    currentPassword: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Type(() => String)
    newPassword: string;
}
