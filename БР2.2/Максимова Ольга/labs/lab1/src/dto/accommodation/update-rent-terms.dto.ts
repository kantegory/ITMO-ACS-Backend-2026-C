import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRentTermsDto {
  @IsOptional()
  @IsString()
  util_serv_pay?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  deposit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  commission?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  with_kids?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  with_pets?: boolean;
}