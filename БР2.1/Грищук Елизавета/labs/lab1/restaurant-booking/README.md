# Restaurant Booking API

REST API для бронирования столиков в ресторанах. Реализовано на основе Express + TypeORM + PostgreSQL + JWT.

## Стек технологий

- **Node.js** + **TypeScript**
- **Express** — HTTP-сервер
- **TypeORM** — ORM для работы с PostgreSQL
- **jsonwebtoken** — JWT-авторизация
- **bcryptjs** — хеширование паролей
- **swagger-ui-express** — документация API

## Запуск

### 1. Запустить базу данных

```bash
docker-compose up -d
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить переменные окружения

Скопировать `.env` и при необходимости изменить значения:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=restaurant_booking
JWT_SECRET=your_jwt_secret_key_here
```

### 4. Запустить сервер в режиме разработки

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`  
Swagger UI: `http://localhost:3000/api/docs`

## Структура проекта

```
src/
├── config/
│   └── database.ts        # Подключение к БД
├── controllers/
│   ├── AuthController.ts  # POST /auth/register, /auth/login
│   ├── UserController.ts  # GET/PATCH /users/me
│   ├── CategoryController.ts  # GET /categories
│   ├── RestaurantController.ts  # /restaurants, /reviews
│   └── BookingController.ts  # /bookings
├── entities/
│   ├── User.ts
│   ├── Category.ts
│   ├── Restaurant.ts
│   ├── Table.ts
│   ├── Booking.ts
│   └── Review.ts
├── middleware/
│   └── auth.ts            # JWT middleware
└── index.ts               # Точка входа
openapi.yaml               # OpenAPI 3.0 схема
```

## Эндпоинты

| Метод | Путь | Авторизация | Описание |
|-------|------|-------------|----------|
| POST | /api/auth/register | — | Регистрация |
| POST | /api/auth/login | — | Авторизация |
| GET | /api/users/me | ✓ | Профиль |
| PATCH | /api/users/me | ✓ | Обновить профиль |
| GET | /api/categories | — | Категории кухни |
| GET | /api/restaurants | — | Список ресторанов |
| GET | /api/restaurants/:id | — | Детали ресторана |
| GET | /api/restaurants/:id/tables | — | Столики ресторана |
| GET | /api/restaurants/:id/reviews | — | Отзывы |
| POST | /api/restaurants/:id/reviews | ✓ | Создать отзыв |
| GET | /api/bookings | ✓ | Мои бронирования |
| POST | /api/bookings | ✓ | Создать бронирование |
| GET | /api/bookings/:id | ✓ | Детали бронирования |
| PATCH | /api/bookings/:id/cancel | ✓ | Отменить бронирование |
