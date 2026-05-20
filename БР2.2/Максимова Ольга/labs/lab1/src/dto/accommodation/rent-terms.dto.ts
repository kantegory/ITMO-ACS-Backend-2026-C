import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RentTermsDto {
  @IsOptional()
  @IsString()
  util_serv_pay?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0) 
  price: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1_000_000)
  deposit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100) 
  commission?: number;

  @IsBoolean()
  @Type(() => Boolean)
  with_kids: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  with_pets: boolean;
}