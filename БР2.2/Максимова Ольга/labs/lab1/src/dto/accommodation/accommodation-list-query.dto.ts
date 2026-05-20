import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VALID_ACCOM_TYPES } from './constants';

export class AccommodationListQueryDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_ACCOM_TYPES)
  accom_type?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1) 
  @Max(20)
  rooms_num?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1) 
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100) 
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sort?: string;
}