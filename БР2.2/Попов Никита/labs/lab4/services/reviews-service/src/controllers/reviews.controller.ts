import { Body, Delete, Get, JsonController, Param, Patch, Post, Res, UseBefore } from "routing-controllers";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Response } from "express";
import { internalAuthMiddleware } from "../middlewares/auth.middleware";
import { ReviewsService } from "../services/reviews.service";
import { ReviewEntity } from "../entities/review.entity";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { dataSource } from "../data-source";
import { publish } from "../kafka";
import {
  CreateReviewDto,
  RemoveReviewResponseDto,
  RestaurantRatingResponseDto,
  RestaurantReviewsResponseDto,
  ReviewResponseDto,
  UpdateReviewDto
} from "../dto/reviews.dto";
function sendResult(result: { data?: unknown; error?: readonly [number, unknown] }, res: Response) {
  if (result.error) return res.status(result.error[0]).json(result.error[1]);
  return res.json({ data: result.data });
}

@JsonController()
export class ReviewsController {
  private readonly reviewsService = new ReviewsService(
    new ReviewsRepository(dataSource.getRepository(ReviewEntity)),
    publish
  );

  @Post("/api/v1/reviews")
  @OpenAPI({ summary: "Create review", tags: ["Reviews"] })
  @ResponseSchema(ReviewResponseDto, { statusCode: 200 })
  async create(@Body() body: CreateReviewDto, @Res() res: Response) {
    return sendResult(await this.reviewsService.create(body), res);
  }

  @Patch("/api/v1/reviews/:id")
  @OpenAPI({ summary: "Update review", tags: ["Reviews"] })
  @ResponseSchema(ReviewResponseDto, { statusCode: 200 })
  async update(@Param("id") id: string, @Body() body: UpdateReviewDto, @Res() res: Response) {
    return sendResult(await this.reviewsService.update(id, body), res);
  }

  @Delete("/api/v1/reviews/:id")
  @OpenAPI({ summary: "Delete review", tags: ["Reviews"] })
  @ResponseSchema(RemoveReviewResponseDto, { statusCode: 200 })
  async remove(@Param("id") id: string, @Res() res: Response) {
    return sendResult(await this.reviewsService.remove(id), res);
  }

  @Get("/internal/v1/restaurants/:restaurantId/rating")
  @UseBefore(internalAuthMiddleware)
  @OpenAPI({
    summary: "Get restaurant rating for internal services",
    tags: ["Internal"],
    security: [{ internalApiKey: [] }]
  })
  @ResponseSchema(RestaurantRatingResponseDto, { statusCode: 200 })
  async internalGetRestaurantRating(@Param("restaurantId") restaurantId: string, @Res() res: Response) {
    return sendResult(await this.reviewsService.internalGetRestaurantRating(restaurantId), res);
  }

  @Get("/internal/v1/restaurants/:restaurantId/reviews")
  @UseBefore(internalAuthMiddleware)
  @OpenAPI({
    summary: "List restaurant reviews for internal services",
    tags: ["Internal"],
    security: [{ internalApiKey: [] }]
  })
  @ResponseSchema(RestaurantReviewsResponseDto, { statusCode: 200 })
  async internalListRestaurantReviews(@Param("restaurantId") restaurantId: string, @Res() res: Response) {
    return sendResult(await this.reviewsService.internalListRestaurantReviews(restaurantId), res);
  }
}
