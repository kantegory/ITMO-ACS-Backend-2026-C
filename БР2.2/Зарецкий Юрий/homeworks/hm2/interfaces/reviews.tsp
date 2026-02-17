import "../models/review.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Управление отзывами
 */
@route("/reviews")
@tag("Отзывы")
interface Reviews {
  /**
   * Получить отзывы об объекте
   */
  @route("/property/{propertyId}")
  @get
  @summary("Отзывы об объекте")
  getPropertyReviews(
    @path propertyId: int64,
    ...PaginationParams,
    ...SortParams
  ): PaginatedResponse<Review> | NotFoundError;

  /**
   * Получить отзывы о пользователе
   */
  @route("/user/{userId}")
  @get
  @summary("Отзывы о пользователе")
  getUserReviews(
    @path userId: int64,
    ...PaginationParams
  ): PaginatedResponse<Review> | NotFoundError;

  /**
   * Создать отзыв об объекте
   * 
   * Только пользователи с завершённой арендой могут оставлять отзывы.
   */
  @route("/property")
  @post
  @summary("Оставить отзыв об объекте")
  createPropertyReview(
    @header("Authorization") authorization: string,
    @body body: PropertyReviewCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<Review>;
  } | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ConflictError;

  /**
   * Создать отзыв о пользователе
   * 
   * Можно оставить отзыв только после завершённой сделки.
   */
  @route("/user")
  @post
  @summary("Оставить отзыв о пользователе")
  createUserReview(
    @header("Authorization") authorization: string,
    @body body: UserReviewCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<Review>;
  } | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ConflictError;

  /**
   * Получить отзыв по ID
   */
  @route("/{reviewId}")
  @get
  @summary("Получить отзыв")
  get(
    @path reviewId: int64
  ): SingleResponse<Review> | NotFoundError;

  /**
   * Обновить свой отзыв
   */
  @route("/{reviewId}")
  @patch
  @summary("Обновить отзыв")
  update(
    @header("Authorization") authorization: string,
    @path reviewId: int64,
    @body body: ReviewUpdate
  ): SingleResponse<Review> | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;

  /**
   * Удалить свой отзыв
   */
  @route("/{reviewId}")
  @delete
  @summary("Удалить отзыв")
  delete(
    @header("Authorization") authorization: string,
    @path reviewId: int64
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Мои отзывы
   * 
   * Список отзывов, оставленных текущим пользователем.
   */
  @route("/my")
  @get
  @summary("Мои отзывы")
  getMyReviews(
    @header("Authorization") authorization: string,
    ...PaginationParams
  ): PaginatedResponse<Review> | UnauthorizedError;
}
