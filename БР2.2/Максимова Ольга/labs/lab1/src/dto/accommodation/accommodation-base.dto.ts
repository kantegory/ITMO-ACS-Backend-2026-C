import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsIn,
  Min,
  Max,
  Length,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

const VALID_ACCOM_TYPES = ['flat', 'house', 'room', 'townhouse', 'dacha'];

export class AccommodationBaseDto {
  @IsString()
  @IsIn(VALID_ACCOM_TYPES)
  accom_type: string;

  @IsString()
  @Length(3, 200) 
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000) 
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1) 
  @Max(20) 
  rooms_num: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive() 
  @Max(1000) 
  living_space?: number;

  @IsBoolean()
  @Type(() => Boolean)
  is_decorated: boolean;
}