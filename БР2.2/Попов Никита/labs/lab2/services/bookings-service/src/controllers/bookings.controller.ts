import { Body, Get, JsonController, Param, Patch, Post, QueryParams, Res, UseBefore } from "routing-controllers";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Response } from "express";
import { internalAuthMiddleware } from "../middlewares/auth.middleware";
import { BookingsService } from "../services/bookings.service";
import { BookingEntity } from "../entities/booking.entity";
import { BookingsRepository } from "../repositories/bookings.repository";
import { dataSource } from "../data-source";
import { publish } from "../kafka";
import {
  BookingResponseDto,
  CreateBookingDto,
  RestaurantBookingsQueryDto,
  RestaurantBookingsResponseDto,
  UpdateBookingStatusDto
} from "../dto/bookings.dto";
function sendResult(result: { data?: unknown; error?: readonly [number, unknown] }, res: Response) {
  if (result.error) return res.status(result.error[0]).json(result.error[1]);
  return res.json({ data: result.data });
}

@JsonController()
export class BookingsController {
  private readonly bookingsService = new BookingsService(
    new BookingsRepository(dataSource.getRepository(BookingEntity)),
    publish
  );

  @Post("/api/v1/bookings")
  @OpenAPI({ summary: "Create booking", tags: ["Bookings"] })
  @ResponseSchema(BookingResponseDto, { statusCode: 200 })
  async create(@Body() body: CreateBookingDto, @Res() res: Response) {
    return sendResult(await this.bookingsService.create(body), res);
  }

  @Patch("/api/v1/bookings/:id/status")
  @OpenAPI({ summary: "Update booking status", tags: ["Bookings"] })
  @ResponseSchema(BookingResponseDto, { statusCode: 200 })
  async updateStatus(@Param("id") id: string, @Body() body: UpdateBookingStatusDto, @Res() res: Response) {
    return sendResult(await this.bookingsService.updateStatus(id, body.status), res);
  }

  @Get("/internal/v1/restaurants/:restaurantId/bookings")
  @UseBefore(internalAuthMiddleware)
  @OpenAPI({
    summary: "List bookings for restaurant",
    tags: ["Internal"],
    security: [{ internalApiKey: [] }]
  })
  @ResponseSchema(RestaurantBookingsResponseDto, { statusCode: 200 })
  async getRestaurantBookings(
    @Param("restaurantId") restaurantId: string,
    @QueryParams() query: RestaurantBookingsQueryDto,
    @Res() res: Response
  ) {
    return sendResult(
      await this.bookingsService.getRestaurantBookings(restaurantId, query.from, query.to, query.statusNot),
      res
    );
  }
}
