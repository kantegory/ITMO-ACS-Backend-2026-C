import "./user.tsp";

namespace RentalService;

/**
 * Сообщение в переписке
 */
model Message {
  @doc("Уникальный идентификатор сообщения")
  id: int64;

  @doc("ID переписки")
  conversationId: int64;

  @doc("ID отправителя")
  senderId: int64;

  @doc("Отправитель")
  sender: UserShort;

  @doc("Текст сообщения")
  @minLength(1)
  @maxLength(2000)
  text: string;

  @doc("Сообщение прочитано получателем")
  isRead: boolean;

  @doc("Время отправки")
  createdAt: utcDateTime;
}

/**
 * Данные для отправки сообщения
 */
model MessageCreate {
  @doc("Текст сообщения")
  @minLength(1)
  @maxLength(2000)
  text: string;
}

/**
 * Пометить сообщения как прочитанные
 */
model MessagesMarkRead {
  @doc("ID сообщений для пометки как прочитанных")
  messageIds: int64[];
}
