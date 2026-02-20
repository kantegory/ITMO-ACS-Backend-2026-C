import "./user.tsp";
import "./property.tsp";

namespace RentalService;

/**
 * Статус сделки аренды
 */
enum DealStatus {
  @doc("Заявка отправлена, ожидает подтверждения")
  requested,

  @doc("Заявка одобрена владельцем")
  approved,

  @doc("Заявка отменена")
  cancelled,
}

/**
 * Сделка аренды
 */
model RentDeal {
  @doc("Уникальный идентификатор сделки")
  id: int64;

  @doc("ID объекта недвижимости")
  propertyId: int64;

  @doc("Объект недвижимости")
  property: PropertyShort;

  @doc("ID арендатора")
  tenantId: int64;

  @doc("Арендатор")
  tenant: UserShort;

  @doc("ID владельца")
  ownerId: int64;

  @doc("Владелец")
  owner: UserShort;

  @doc("Дата начала аренды")
  startDate: plainDate;

  @doc("Дата окончания аренды")
  endDate: plainDate;

  @doc("Статус сделки")
  status: DealStatus;

  @doc("Итоговая стоимость аренды")
  @minValue(0)
  totalPrice: decimal;

  @doc("Комментарий к заявке от арендатора")
  @maxLength(1000)
  comment?: string;

  @doc("Причина отмены (если отменена)")
  @maxLength(500)
  cancellationReason?: string;

  @doc("Дата создания заявки")
  createdAt: utcDateTime;

  @doc("Дата последнего обновления")
  updatedAt: utcDateTime;
}

/**
 * Краткая информация о сделке (для списков)
 */
model RentDealShort {
  @doc("ID сделки")
  id: int64;

  @doc("ID объекта")
  propertyId: int64;

  @doc("Заголовок объекта")
  propertyTitle: string;

  @doc("URL фото объекта")
  propertyPhotoUrl?: string;

  @doc("Дата начала")
  startDate: plainDate;

  @doc("Дата окончания")
  endDate: plainDate;

  @doc("Статус")
  status: DealStatus;

  @doc("Итоговая стоимость")
  totalPrice: decimal;
}

/**
 * Данные для создания заявки на аренду
 */
model RentDealCreate {
  @doc("ID объекта недвижимости")
  propertyId: int64;

  @doc("Дата начала аренды")
  startDate: plainDate;

  @doc("Дата окончания аренды")
  endDate: plainDate;

  @doc("Комментарий к заявке")
  @maxLength(1000)
  comment?: string;
}

/**
 * Данные для подтверждения/отклонения заявки
 */
model RentDealStatusUpdate {
  @doc("Новый статус")
  status: "approved" | "cancelled";

  @doc("Причина отмены (обязательна при отмене)")
  @maxLength(500)
  cancellationReason?: string;
}
