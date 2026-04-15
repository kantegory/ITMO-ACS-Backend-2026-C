import { Body, Delete, Get, JsonController, Param, Patch, Post, QueryParams, Res, UseBefore } from "routing-controllers";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Response } from "express";
import { internalAuthMiddleware } from "../middlewares/auth.middleware";
import { dataSource } from "../data-source";
import { MenuItemEntity } from "../entities/menu-item.entity";
import { RestaurantEntity } from "../entities/restaurant.entity";
import { publish } from "../kafka";
import { RestaurantsRepository } from "../repositories/restaurants.repository";
import { RestaurantsService } from "../services/restaurants.service";
import {
  CreateRestaurantDto,
  DeleteMenuItemResponseDto,
  MenuItemResponseDto,
  RatingResponseDto,
  RestaurantResponseDto,
  RestaurantsListResponseDto,
  RestaurantsListQueryDto,
  RestaurantWithDetailsResponseDto,
  UpdateRatingDto,
  UpdateRestaurantDto,
  UpsertMenuItemDto
} from "../dto/restaurants.dto";
function sendResult(result: { data?: unknown; error?: readonly [number, unknown] }, res: Response) {
  if (result.error) return res.status(result.error[0]).json(result.error[1]);
  return res.json({ data: result.data });
}

@JsonController()
export class RestaurantsController {
  private readonly restaurantsService = new RestaurantsService(
    new RestaurantsRepository(
      dataSource.getRepository(RestaurantEntity),
      dataSource.getRepository(MenuItemEntity)
    ),
    publish
  );

  @Get("/api/v1/restaurants")
  @OpenAPI({ summary: "Get restaurants list", tags: ["Restaurants"] })
  @ResponseSchema(RestaurantsListResponseDto, { statusCode: 200 })
  async listRestaurants(@QueryParams() query: RestaurantsListQueryDto, @Res() res: Response) {
    return sendResult(
      await this.restaurantsService.listRestaurants({
        page: query.page ? String(query.page) : undefined,
        limit: query.limit ? String(query.limit) : undefined,
        priceLevel: query.priceLevel,
        cuisine: query.cuisine,
        city: query.city
      }),
      res
    );
  }

  @Post("/api/v1/restaurants")
  @OpenAPI({ summary: "Create restaurant", tags: ["Restaurants"] })
  @ResponseSchema(RestaurantResponseDto, { statusCode: 200 })
  async createRestaurant(@Body() body: CreateRestaurantDto, @Res() res: Response) {
    return sendResult(await this.restaurantsService.createRestaurant(body), res);
  }

  @Get("/api/v1/restaurants/:id")
  @OpenAPI({ summary: "Get restaurant by id", tags: ["Restaurants"] })
  @ResponseSchema(RestaurantWithDetailsResponseDto, { statusCode: 200 })
  async getRestaurantById(@Param("id") id: string, @Res() res: Response) {
    return sendResult(await this.restaurantsService.getRestaurantById(id), res);
  }

  @Patch("/api/v1/restaurants/:id")
  @OpenAPI({ summary: "Update restaurant", tags: ["Restaurants"] })
  @ResponseSchema(RestaurantResponseDto, { statusCode: 200 })
  async updateRestaurant(@Param("id") id: string, @Body() body: UpdateRestaurantDto, @Res() res: Response) {
    return sendResult(await this.restaurantsService.updateRestaurant(id, body), res);
  }

  @Post("/api/v1/restaurants/:restaurantId/menu-items")
  @OpenAPI({ summary: "Create or update menu item", tags: ["Menu"] })
  @ResponseSchema(MenuItemResponseDto, { statusCode: 200 })
  async upsertMenuItem(
    @Param("restaurantId") restaurantId: string,
    @Body() body: UpsertMenuItemDto,
    @Res() res: Response
  ) {
    return sendResult(await this.restaurantsService.upsertMenuItem(restaurantId, body), res);
  }

  @Delete("/api/v1/restaurants/:restaurantId/menu-items/:id")
  @OpenAPI({ summary: "Delete menu item", tags: ["Menu"] })
  @ResponseSchema(DeleteMenuItemResponseDto, { statusCode: 200 })
  async deleteMenuItem(
    @Param("restaurantId") restaurantId: string,
    @Param("id") id: string,
    @Res() res: Response
  ) {
    return sendResult(await this.restaurantsService.deleteMenuItem(restaurantId, id), res);
  }

  @Get("/internal/v1/restaurants/:restaurantId")
  @UseBefore(internalAuthMiddleware)
  @OpenAPI({
    summary: "Get restaurant for internal usage",
    tags: ["Internal"],
    security: [{ internalApiKey: [] }]
  })
  @ResponseSchema(RestaurantResponseDto, { statusCode: 200 })
  async internalGetRestaurant(@Param("restaurantId") restaurantId: string, @Res() res: Response) {
    return sendResult(await this.restaurantsService.internalGetRestaurant(restaurantId), res);
  }

  @Patch("/internal/v1/restaurants/:restaurantId/rating")
  @UseBefore(internalAuthMiddleware)
  @OpenAPI({
    summary: "Update restaurant rating",
    tags: ["Internal"],
    security: [{ internalApiKey: [] }]
  })
  @ResponseSchema(RatingResponseDto, { statusCode: 200 })
  async updateRating(
    @Param("restaurantId") restaurantId: string,
    @Body() body: UpdateRatingDto,
    @Res() res: Response
  ) {
    return sendResult(await this.restaurantsService.updateRating(restaurantId, Number(body.rating)), res);
  }
}
