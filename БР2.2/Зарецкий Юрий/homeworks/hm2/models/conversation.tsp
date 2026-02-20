import "./user.tsp";
import "./property.tsp";

namespace RentalService;

/**
 * Переписка между пользователями
 */
model Conversation {
  @doc("Уникальный идентификатор переписки")
  id: int64;

  @doc("ID первого участника")
  user1Id: int64;

  @doc("Первый участник")
  user1: UserShort;

  @doc("ID второго участника")
  user2Id: int64;

  @doc("Второй участник")
  user2: UserShort;

  @doc("ID объекта недвижимости (тема переписки)")
  propertyId: int64;

  @doc("Объект недвижимости")
  property: PropertyShort;

  @doc("Последнее сообщение")
  lastMessage?: MessageShort;

  @doc("Количество непрочитанных сообщений")
  unreadCount: int32;

  @doc("Дата создания")
  createdAt: utcDateTime;

  @doc("Дата последнего сообщения")
  updatedAt: utcDateTime;
}

/**
 * Краткая информация о переписке (для списка)
 */
model ConversationShort {
  @doc("ID переписки")
  id: int64;

  @doc("Собеседник")
  otherUser: UserShort;

  @doc("Объект недвижимости")
  property: PropertyShort;

  @doc("Последнее сообщение")
  lastMessage?: MessageShort;

  @doc("Количество непрочитанных")
  unreadCount: int32;

  @doc("Дата последнего сообщения")
  updatedAt: utcDateTime;
}

/**
 * Данные для создания переписки
 */
model ConversationCreate {
  @doc("ID собеседника")
  userId: int64;

  @doc("ID объекта недвижимости")
  propertyId: int64;

  @doc("Первое сообщение")
  @minLength(1)
  @maxLength(2000)
  message: string;
}

/**
 * Краткая информация о сообщении
 */
model MessageShort {
  @doc("ID сообщения")
  id: int64;

  @doc("Текст сообщения (обрезанный)")
  @maxLength(100)
  text: string;

  @doc("ID отправителя")
  senderId: int64;

  @doc("Прочитано ли")
  isRead: boolean;

  @doc("Время отправки")
  createdAt: utcDateTime;
}
