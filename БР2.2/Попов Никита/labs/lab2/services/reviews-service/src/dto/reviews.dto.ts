import { Type } from "class-transformer";
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";

export class CreateReviewDto {
  @IsString()
  userId!: string;

  @IsString()
  restaurantId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class ReviewDto {
  @IsString()
  id!: string;

  @IsString()
  userId!: string;

  @IsString()
  restaurantId!: string;

  @IsInt()
  rating!: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class ReviewResponseDto {
  @ValidateNested()
  @Type(() => ReviewDto)
  data!: ReviewDto;
}

export class RemoveReviewResponseDataDto {
  @IsString()
  id!: string;
}

export class RemoveReviewResponseDto {
  @ValidateNested()
  @Type(() => RemoveReviewResponseDataDto)
  data!: RemoveReviewResponseDataDto;
}

export class RestaurantRatingResponseDataDto {
  @IsString()
  restaurantId!: string;

  @IsNumber()
  rating!: number;
}

export class RestaurantRatingResponseDto {
  @ValidateNested()
  @Type(() => RestaurantRatingResponseDataDto)
  data!: RestaurantRatingResponseDataDto;
}

export class RestaurantReviewsResponseDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewDto)
  items!: ReviewDto[];
}

export class RestaurantReviewsResponseDto {
  @ValidateNested()
  @Type(() => RestaurantReviewsResponseDataDto)
  data!: RestaurantReviewsResponseDataDto;
}
