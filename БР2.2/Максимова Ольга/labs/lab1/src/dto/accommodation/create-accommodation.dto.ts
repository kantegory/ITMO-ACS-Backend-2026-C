import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';
import { AccommodationBaseDto } from './accommodation-base.dto';
import { RentTermsDto } from './rent-terms.dto';

export class CreateAccommodationDto {
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ValidateNested()
  @Type(() => AccommodationBaseDto)
  accommodation: AccommodationBaseDto;

  @ValidateNested()
  @Type(() => RentTermsDto)
  rent_terms: RentTermsDto;

  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  facility_ids: number[];
}