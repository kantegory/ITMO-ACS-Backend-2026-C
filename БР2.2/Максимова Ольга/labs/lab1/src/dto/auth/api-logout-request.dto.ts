import { IsOptional, IsString } from 'class-validator';

export class ApiLogoutRequest {
    @IsOptional()
    @IsString()
    refresh_token?: string;
}