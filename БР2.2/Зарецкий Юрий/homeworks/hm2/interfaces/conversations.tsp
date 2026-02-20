import "../models/conversation.tsp";
import "../models/error.tsp";
import "../models/param.tsp";
import "@typespec/http";

using Http;

namespace RentalService;

/**
 * Управление переписками
 */
@route("/conversations")
@tag("Сообщения")
interface Conversations {
  /**
   * Получить список переписок
   * 
   * Все переписки текущего пользователя.
   */
  @get
  @summary("Мои переписки")
  list(
    @header("Authorization") authorization: string,
    ...PaginationParams
  ): PaginatedResponse<ConversationShort> | UnauthorizedError;

  /**
   * Создать переписку
   * 
   * Начинает новую переписку с пользователем по поводу объекта.
   * Если переписка уже существует, возвращает существующую.
   */
  @post
  @summary("Начать переписку")
  create(
    @header("Authorization") authorization: string,
    @body body: ConversationCreate
  ): {
    @statusCode statusCode: 201;
    @body body: SingleResponse<Conversation>;
  } | SingleResponse<Conversation> | UnauthorizedError | NotFoundError | ValidationError;

  /**
   * Получить переписку
   * 
   * Детальная информация о переписке.
   */
  @route("/{conversationId}")
  @get
  @summary("Получить переписку")
  get(
    @header("Authorization") authorization: string,
    @path conversationId: int64
  ): SingleResponse<Conversation> | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Удалить переписку
   * 
   * Удаляет переписку для текущего пользователя.
   */
  @route("/{conversationId}")
  @delete
  @summary("Удалить переписку")
  delete(
    @header("Authorization") authorization: string,
    @path conversationId: int64
  ): {
    @statusCode statusCode: 204;
  } | UnauthorizedError | ForbiddenError | NotFoundError;

  /**
   * Получить количество непрочитанных сообщений
   */
  @route("/unread-count")
  @get
  @summary("Количество непрочитанных")
  getUnreadCount(
    @header("Authorization") authorization: string
  ): {
    @body body: {
      totalUnread: int32;
    };
  } | UnauthorizedError;
}
