import { Type } from "class-transformer";
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class CreateBookingDto {
  @IsString()
  userId!: string;

  @IsString()
  restaurantId!: string;

  @IsDateString()
  fromDate!: string;

  @IsDateString()
  toDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount!: number;
}

export class UpdateBookingStatusDto {
  @IsString()
  status!: string;
}

export class RestaurantBookingsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  statusNot?: string;
}

export class BookingDto {
  @IsString()
  id!: string;

  @IsString()
  userId!: string;

  @IsString()
  restaurantId!: string;

  @IsDateString()
  fromDate!: Date;

  @IsDateString()
  toDate!: Date;

  @IsInt()
  guestCount!: number;

  @IsString()
  status!: string;
}

export class BookingResponseDto {
  @ValidateNested()
  @Type(() => BookingDto)
  data!: BookingDto;
}

export class RestaurantBookingsListDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingDto)
  items!: BookingDto[];

  @IsInt()
  total!: number;
}

export class RestaurantBookingsResponseDto {
  @ValidateNested()
  @Type(() => RestaurantBookingsListDto)
  data!: RestaurantBookingsListDto;
}
