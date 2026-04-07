import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ApiError {
    @Type(() => Number)
    @IsNumber()
    code: number;

    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    exception?: string;

    @IsOptional()
    @IsString()
    exc_type?: string;
}

export class ApiUnauthorized extends ApiError {
    @Type(() => Number)
    @IsNumber()
    code: number = 401;
}

export class ApiConflict extends ApiError {
    @Type(() => Number)
    @IsNumber()
    code: number = 409;
}

export class ApiValidation extends ApiError {
    @Type(() => Number)
    @IsNumber()
    code: number = 422;
}

export class ApiServerError extends ApiError {
    @Type(() => Number)
    @IsNumber()
    code: number = 500;
}