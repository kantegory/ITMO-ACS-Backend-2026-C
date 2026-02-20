import "../models/rent-deal.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Управление сделками аренды
 */
@route("/rent-deals")
@tag("Сделки аренды")
interface RentDeals {
  /**
   * Создать заявку на аренду
   * 
   * Арендатор создаёт заявку на бронирование объекта.
   * Автоматически рассчитывается итоговая стоимость.
   */
  @post
  @summary("Создать заявку на аренду")
  create(
    @header("Authorization") authorization: string,
    @body body: RentDealCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<RentDeal>;
  } | UnauthorizedError | NotFoundError | ValidationError | ConflictError | InternalServerError;

  /**
   * Получить сделку по ID
   * 
   * Детальная информация о сделке.
   * Доступна только участникам сделки (арендатор или владелец).
   */
  @route("/{dealId}")
  @get
  @summary("Получить сделку")
  get(
    @header("Authorization") authorization: string,
    @path dealId: int64
  ): SingleResponse<RentDeal> | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Изменить статус сделки
   * 
   * Владелец может одобрить или отклонить заявку.
   * Арендатор может отменить свою заявку.
   */
  @route("/{dealId}/status")
  @patch
  @summary("Изменить статус сделки")
  updateStatus(
    @header("Authorization") authorization: string,
    @path dealId: int64,
    @body body: RentDealStatusUpdate
  ): SingleResponse<RentDeal> | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError | ConflictError;

  /**
   * Получить заявки по объекту
   * 
   * Список всех заявок на конкретный объект.
   * Доступно только владельцу объекта.
   */
  @route("/property/{propertyId}")
  @get
  @summary("Заявки по объекту")
  getByProperty(
    @header("Authorization") authorization: string,
    @path propertyId: int64,
    @query status?: DealStatus,
    ...PaginationParams
  ): PaginatedResponse<RentDeal> | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Проверить доступность объекта
   * 
   * Проверяет, свободен ли объект в указанные даты.
   */
  @route("/check-availability")
  @get
  @summary("Проверить доступность")
  checkAvailability(
    @query propertyId: int64,
    @query startDate: plainDate,
    @query endDate: plainDate
  ): {
    @body body: {
      available: boolean;
      conflictingDeals?: RentDealShort[];
    };
  } | NotFoundError | ValidationError;
}
