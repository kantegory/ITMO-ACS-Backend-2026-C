import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  @Length(2, 100)
  city: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  district?: string;

  @IsString()
  @Length(2, 150)
  street: string;

  @IsString()
  @Length(1, 20)
  house_num: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(999)
  building?: number;
}