import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  Max,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateRentTermsDto } from './update-rent-terms.dto'; // см. ниже

const VALID_ACCOM_TYPES = ['flat', 'house', 'room', 'townhouse', 'dacha'];

export class UpdateAccommodationDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  rooms_num?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1000)
  living_space?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_decorated?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_published?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRentTermsDto)
  rent_terms?: UpdateRentTermsDto;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  facility_ids?: number[];

  @IsOptional()
  @IsString()
  @IsIn(VALID_ACCOM_TYPES)
  accom_type?: string;
}