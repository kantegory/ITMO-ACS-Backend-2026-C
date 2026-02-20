import "../models/message.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Управление сообщениями в переписках
 */
@route("/conversations/{conversationId}/messages")
@tag("Сообщения")
interface Messages {
  /**
   * Получить сообщения переписки
   * 
   * Список сообщений с пагинацией (от новых к старым).
   */
  @get
  @summary("Сообщения переписки")
  list(
    @header("Authorization") authorization: string,
    @path conversationId: int64,
    ...PaginationParams
  ): PaginatedResponse<Message> | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Отправить сообщение
   * 
   * Добавляет новое сообщение в переписку.
   */
  @post
  @summary("Отправить сообщение")
  send(
    @header("Authorization") authorization: string,
    @path conversationId: int64,
    @body body: MessageCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<Message>;
  } | UnauthorizedError | ForbiddenError | NotFoundError | ValidationError;

  /**
   * Пометить сообщения как прочитанные
   * 
   * Отмечает указанные сообщения как прочитанные.
   */
  @route("/mark-read")
  @post
  @summary("Пометить как прочитанные")
  markAsRead(
    @header("Authorization") authorization: string,
    @path conversationId: int64,
    @body body: MessagesMarkRead
  ): SuccessResponse | UnauthorizedError | ForbiddenError | NotFoundError;
}
