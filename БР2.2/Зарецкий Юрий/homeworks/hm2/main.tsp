import "@typespec/http";
import "@typespec/openapi";

// Импорт интерфейсов
import "./interfaces/auth.tsp";
import "./interfaces/users.tsp";
import "./interfaces/cities.tsp";
import "./interfaces/comforts.tsp";
import "./interfaces/properties.tsp";
import "./interfaces/property-photos.tsp";
import "./interfaces/rent-deals.tsp";
import "./interfaces/conversations.tsp";
import "./interfaces/messages.tsp";
import "./interfaces/reviews.tsp";

using Http;
using OpenAPI;

/**
 * REST API для сервиса аренды недвижимости
 * 
 * Платформа позволяет пользователям:
 * - Регистрироваться и авторизовываться
 * - Размещать объекты недвижимости для аренды
 * - Искать и фильтровать объекты по различным параметрам
 * - Бронировать объекты и управлять сделками аренды
 * - Общаться через встроенный чат
 * - Оставлять отзывы об объектах и пользователях
 */
@service({
  title: "Property Rental Service API",
  version: "0.0.1"
})
@server("/", "")
namespace RentalService;
