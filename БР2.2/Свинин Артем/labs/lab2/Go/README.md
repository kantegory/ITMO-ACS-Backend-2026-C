# Rental Platform — Go Microservices

Микросервисная платформа аренды недвижимости на Go. Проект использует стандартную библиотеку для HTTP-слоя, PostgreSQL для хранения данных и Kafka для межсервисных событий.

## Что есть сейчас

- 7 сервисов: auth, user, property, booking, payment, review и communication.
- У каждого сервиса собственный HTTP API и отдельная база данных PostgreSQL.
- Межсервисное взаимодействие идет через HTTP-клиенты с `Authorization: Bearer ...` и `X-Service-Token`.
- Kafka используется для событий бронирований и платежей.
- Публичный контракт описан в [openapi.yaml](openapi.yaml).

## Структура репозитория

```text
rental-platform/
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── openapi.yaml
├── pkg/
│   └── shared/
│       ├── dbutil/
│       ├── httputil/
│       ├── kafka/
│       ├── middleware/
│       └── pagination/
└── services/
    ├── auth/
    ├── user/
    ├── property/
    ├── booking/
    ├── payment/
    ├── review/
    └── communication/
```

## Сервисы

| Сервис | Порт | Ответственность |
|---|---:|---|
| Auth | 8081 | Регистрация, вход, refresh/logout, валидация токенов |
| User | 8082 | Профили пользователей и избранное |
| Property | 8083 | Объявления, адреса, удобства, изображения |
| Booking | 8084 | Бронирования, внутренняя проверка доступности и статусов |
| Payment | 8085 | Транзакции и webhook-обработка платежей |
| Review | 8086 | Отзывы и рейтинги |
| Communication | 8087 | Чаты и сообщения |
| API Gateway | 8080 | Nginx-прокси для локального доступа |

## Публичные маршруты

Полный контракт маршрутов и схем находится в [openapi.yaml](openapi.yaml).

- Auth: `/auth/login`, `/auth/register`, `/auth/logout`, `/auth/refresh`, `/auth/tokens/validate`, `/auth/users/validate`, `/auth/users/{id}`
- User: `/users/me`, `/users/{id}`, `/favourites`, `/favourites/{id}`
- Property: `/properties`, `/properties/{id}`, `/properties/my`, `/addresses`, `/facilities`, `/images`
- Booking: `/bookings`, `/bookings/my`, `/bookings/incoming`, `/bookings/{id}`
- Payment: `/transactions`, `/transactions/{id}`
- Review: `/reviews`, `/reviews/{id}`
- Communication: `/chats`, `/chats/{id}`, `/messages`, `/messages/{id}`

У каждого сервиса также есть `/health`.

## Внутренние маршруты

Для межсервисных проверок и вызовов используются внутренние endpoints с префиксом `/internal`.

- Auth: `/auth/tokens/validate`, `/auth/users/validate`, `/auth/users/{id}`
- User: `/internal/users/validate-ownership`, `/internal/users/{id}`
- Property: `/internal/properties/validate`, `/internal/properties/by-owner/{id}`, `/internal/properties/{id}`
- Booking: `/internal/bookings/validate-review-eligibility`, `/internal/bookings/by-property/{id}`, `/internal/bookings/by-user/{id}`, `/internal/bookings/{id}`
- Payment: `/internal/payments/transactions/by-booking/{id}`, `/internal/payments/transactions/{id}`, `/internal/payments/webhook`
- Review: `/internal/reviews/can-create`, `/internal/reviews/property-rating/{id}`, `/internal/reviews/user-rating/{id}`, `/internal/reviews/by-booking/{id}`
- Communication: `/internal/chats/by-property/{id}`, `/internal/chats/by-booking/{id}`, `/internal/chats/validate-participant`, `/internal/chats/{id}`

## Kafka-события

| Событие | Кто публикует | Кто читает |
|---|---|---|
| `booking.created` | Booking | Payment, Communication |
| `booking.completed` | Booking | Review |
| `booking.cancelled` | Booking | Payment |
| `payment.success` | Payment | Booking, Communication |
| `payment.failed` | Payment | Booking |

Kafka-клиент в [pkg/shared/kafka](pkg/shared/kafka) используется реальный, на базе `segmentio/kafka-go`.

## Хранилище

Каждый сервис работает со своей базой PostgreSQL. В `docker-compose.yml` поднимаются отдельные контейнеры для:

- auth-db
- user-db
- property-db
- booking-db
- payment-db
- review-db
- communication-db

## Запуск локально

### Через Docker Compose

```bash
docker compose up --build
```

После запуска:

- API Gateway: `http://localhost:8080`
- Auth: `http://localhost:8081`
- User: `http://localhost:8082`
- Property: `http://localhost:8083`
- Booking: `http://localhost:8084`
- Payment: `http://localhost:8085`
- Review: `http://localhost:8086`
- Communication: `http://localhost:8087`
- Kafka UI: `http://localhost:9080`

### Отдельный сервис

```bash
cd services/auth
PORT=8081 JWT_SECRET=secret go run ./cmd
```

## Переменные окружения

### Общие

- `PORT` — порт сервиса
- `DATABASE_URL` — строка подключения к PostgreSQL
- `KAFKA_BROKER` — адрес Kafka, по умолчанию `kafka:9092`
- `SERVICE_TOKEN` — токен для внутренних запросов между сервисами

### Auth

- `JWT_SECRET` — секрет для подписи JWT

### Межсервисные URL

- `AUTH_SERVICE_URL`
- `USER_SERVICE_URL`
- `PROPERTY_SERVICE_URL`
- `BOOKING_SERVICE_URL`

## Gateway

Nginx-конфигурация находится в [nginx.conf](nginx.conf). Она поднимает gateway на `8080` и проксирует сервисы под `/v1/...`.
