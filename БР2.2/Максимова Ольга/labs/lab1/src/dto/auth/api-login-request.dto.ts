import { IsEmail, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class ApiLoginRequest {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @MinLength(6)
    @Type(() => String)
    password: string;
}