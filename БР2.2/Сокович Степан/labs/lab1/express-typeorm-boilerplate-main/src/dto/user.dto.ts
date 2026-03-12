import { Type } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    MinLength,
} from 'class-validator';
import { UserType } from '../models/enums';

export class ListUsersQueryDto {
    @IsOptional()
    @IsEnum(UserType)
    type?: UserType;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset?: number = 0;
}

export class CreateUserDto {
    @IsString()
    @Type(() => String)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;

    @IsEnum(UserType)
    @Type(() => String)
    type: UserType;
}

export class UpdateUserDto {
    @IsString()
    @Type(() => String)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsEnum(UserType)
    @Type(() => String)
    type: UserType;
}

export class PatchUserDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsEmail()
    @Type(() => String)
    email?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsEnum(UserType)
    @Type(() => String)
    type?: UserType;
}
