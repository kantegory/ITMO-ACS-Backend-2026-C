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
  IsArray,
  ValidateNested,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";

const VALID_ACCOM_TYPES = ["flat", "house", "room", "townhouse", "dacha"];

export class AddressDto {
  @IsString()
  @Length(2, 100)
  city!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  district?: string;

  @IsString()
  @Length(2, 150)
  street!: string;

  @IsString()
  @Length(1, 20)
  house_num!: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  building?: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  district?: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  street?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  house_num?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  building?: string;
}

export class AccommodationBaseDto {
  @IsString()
  @IsIn(VALID_ACCOM_TYPES)
  accom_type!: string;

  @IsString()
  @Length(3, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(20)
  rooms_num!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @IsPositive()
  @Max(1000)
  living_space?: number;

  @IsBoolean()
  @Type(() => Boolean)
  is_decorated!: boolean;
}

export class UpdateAccommodationBaseDto {
  @IsOptional()
  @IsString()
  @IsIn(VALID_ACCOM_TYPES)
  accom_type?: string;

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
  @IsPositive()
  @Max(1000)
  living_space?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_decorated?: boolean;
}

export class RentTermsDto {
  @IsOptional()
  @IsString()
  util_serv_pay?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price!: number;

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
  with_kids!: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  with_pets!: boolean;
}

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
  @Max(1_000_000)
  deposit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
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

export class CreateAccommodationDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ValidateNested()
  @Type(() => AccommodationBaseDto)
  accommodation!: AccommodationBaseDto;

  @ValidateNested()
  @Type(() => RentTermsDto)
  rent_terms!: RentTermsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facility_names?: string[];
}

export class UpdateAccommodationDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAddressDto)
  address?: UpdateAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAccommodationBaseDto)
  accommodation?: UpdateAccommodationBaseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRentTermsDto)
  rent_terms?: UpdateRentTermsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facility_names?: string[];

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  photo_urls?: string[];
}

export class SearchFiltersDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @IsString()
  @IsIn(VALID_ACCOM_TYPES)
  accomType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  roomsNum?: number;

  @IsOptional()
  @IsBoolean()
  withKids?: boolean;

  @IsOptional()
  @IsBoolean()
  withPets?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

export class AccommodationItem {
  accommodation!: {
    title: string;
    roomsNum: number;
    // isPublished: boolean;
    // isRented: boolean;
    address: {
      city: string;
      district?: string | null;
      street: string;
      house_num: string;
      building?: string | null;
    };
    rentTerms: {
      price: number;
      deposit?: number | null;
      commission?: number | null;
      withKids: boolean;
      withPets: boolean;
    };
  };
}

export interface UserValDTO {
  id: string;
  is_verified: boolean;
}