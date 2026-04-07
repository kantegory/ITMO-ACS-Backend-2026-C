import { IsString, IsOptional } from 'class-validator';

export class ApiUserResponse {
    @IsString()
    first_name: string;

    @IsOptional()
    @IsString()
    middle_name?: string;

    @IsString()
    last_name: string;

    @IsString()
    email: string;
}