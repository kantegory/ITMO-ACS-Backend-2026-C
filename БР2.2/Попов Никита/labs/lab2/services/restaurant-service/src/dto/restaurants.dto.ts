import { Type } from "class-transformer";
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class CreateRestaurantDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  priceLevel!: string;

  @IsString()
  cuisine!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  priceLevel?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

export class UpsertMenuItemDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;
}

export class UpdateRatingDto {
  @Type(() => Number)
  @IsNumber()
  rating!: number;
}

export class RestaurantsListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  priceLevel?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class MenuItemDto {
  @IsString()
  id!: string;

  @IsString()
  restaurantId!: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;
}

export class RestaurantDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsInt()
  capacity!: number;

  @IsString()
  priceLevel!: string;

  @IsString()
  cuisine!: string;

  @IsString()
  city!: string;

  @IsArray()
  @IsString({ each: true })
  photos!: string[];

  @IsNumber()
  rating!: number;
}

export class RestaurantWithDetailsDto extends RestaurantDto {
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  menu!: MenuItemDto[];

  @IsArray()
  reviews!: unknown[];
}

export class RestaurantResponseDto {
  @ValidateNested()
  @Type(() => RestaurantDto)
  data!: RestaurantDto;
}

export class RestaurantWithDetailsResponseDto {
  @ValidateNested()
  @Type(() => RestaurantWithDetailsDto)
  data!: RestaurantWithDetailsDto;
}

export class RestaurantsFiltersDto {
  @IsOptional()
  @IsString()
  priceLevel?: string;

  @IsOptional()
  @IsString()
  cuisine?: string;

  @IsOptional()
  @IsString()
  city?: string;
}

export class RestaurantsListDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestaurantDto)
  items!: RestaurantDto[];

  @IsInt()
  total!: number;

  @IsInt()
  page!: number;

  @IsInt()
  limit!: number;

  @ValidateNested()
  @Type(() => RestaurantsFiltersDto)
  filters!: RestaurantsFiltersDto;
}

export class RestaurantsListResponseDto {
  @ValidateNested()
  @Type(() => RestaurantsListDataDto)
  data!: RestaurantsListDataDto;
}

export class MenuItemResponseDto {
  @ValidateNested()
  @Type(() => MenuItemDto)
  data!: MenuItemDto;
}

export class DeleteMenuItemDataDto {
  @IsString()
  id!: string;
}

export class DeleteMenuItemResponseDto {
  @ValidateNested()
  @Type(() => DeleteMenuItemDataDto)
  data!: DeleteMenuItemDataDto;
}

export class RatingDataDto {
  @IsString()
  restaurantId!: string;

  @IsNumber()
  rating!: number;
}

export class RatingResponseDto {
  @ValidateNested()
  @Type(() => RatingDataDto)
  data!: RatingDataDto;
}
