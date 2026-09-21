# Бронирование столиков в ресторанах — REST API

ЛР1 курса «Бэкенд-разработка» (ИТМО). REST API на основе бойлерплейта
[express-typeorm-boilerplate](https://github.com/kantegory/express-typeorm-boilerplate),
реализующий вариант «бронирование столиков» по спецификации `openapi.yaml`
(перенесена из ДЗ2), с моделями и ограничениями по ДЗ1.

## Стек

Node.js 20, Express, TypeORM, PostgreSQL, [routing-controllers](https://github.com/typestack/routing-controllers),
class-validator, JWT.

## Требования

- Node.js **20.x** (используется `--env-file`, доступный с 20.6).
- Docker (для PostgreSQL).

## Команды запуска и переменные `.env`

```bash
npm install          # установить зависимости из package.json (один раз после клонирования)
docker compose up -d # поднять контейнер PostgreSQL в фоне (-d — detached, не занимает терминал)
npm run dev          # запустить сервер на http://localhost:8000 с автоперезапуском при изменении файлов
npm run seed         # один раз на чистой базе — наполнить её тестовыми данными
```

Команды объявлены в `package.json`:
- `dev` — `npx tsx --env-file=.env --watch src/app.ts` (сервер с автоперезапуском при изменении файлов);
- `seed` — `npx tsx --env-file=.env src/seeds/seed.ts`;
- `build` / `start` — компиляция в `dist/` и запуск скомпилированной версии (`node dist/app.js`);
- `format` — `prettier --write "src/**/*.ts"`.

Переменные из `.env` (читаются в `src/config/settings.ts`):

| Переменная | Значение в `.env` | Назначение |
|---|---|---|
| `APP_API_PREFIX` | `/api/v1` | префикс всех маршрутов |
| `APP_CONTROLLERS_PATH` | `/controllers/*.controller.ts` | не используется — контроллеры подключаются вручную в `app.ts`, автоподключение по маске закомментировано |
| `DB_ENTITIES` | `src/models/*.entity.ts` | шаблон пути к моделям для TypeORM |
| `DB_SUBSCRIBERS` | `src/models/*.subscriber.ts` | шаблон пути к подписчикам |
| `JWT_SECRET_KEY` | случайная строка (сгенерирована при настройке) | секрет для подписи JWT |
| `JWT_ACCESS_TOKEN_LIFETIME` | `3600` | время жизни токена, секунды |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | `maindb` / `maindb` / `maindb` | переменные официального Docker-образа postgres для создания базы/пользователя |

Переменных `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `APP_HOST`, `APP_PORT`, `APP_PROTOCOL`, `JWT_TOKEN_TYPE` в `.env` нет — они берутся из значений по умолчанию прямо в `settings.ts`: `localhost`, `15432`, `maindb`, `maindb`, `maindb`, `localhost`, `8000`, `http`, `'Bearer'` соответственно. Порт БД по умолчанию (15432) совпадает с портом, который `docker-compose.yml` пробрасывает на хост, поэтому подключение работает без явного `DB_PORT` в `.env`.

Docker: `docker-compose.yml` поднимает `postgres:17`, пробрасывает `15432:5432`, данные хранятся в `./dbs/postgres-data` (bind mount, не именованный volume).

## Перезапуск сервера с чистой базой

Нужно, например, перед прогоном Postman-коллекций из `postman-collections/` — они рассчитаны на базу ровно в том состоянии, которое создаёт `npm run seed` на пустых таблицах (если запустить `seed` повторно на непустой базе, будет ошибка дублирования email/названий).

PowerShell (Windows):

```powershell
docker compose down             # остановить и удалить контейнер с PostgreSQL
Remove-Item -Recurse -Force dbs # стереть с диска все данные базы (папку dbs/postgres-data)
docker compose up -d            # поднять новый пустой контейнер PostgreSQL
npm run dev                     # запустить сервер — он сам создаст таблицы при подключении к пустой базе
```

В отдельном окне терминала, после того как в консоли сервера появится `Data Source has been initialized!`:

```powershell
npm run seed
```

`docker compose down` останавливает и удаляет контейнер с PostgreSQL, `Remove-Item -Recurse -Force dbs` стирает данные с диска (папка `./dbs/postgres-data`, которую подключает `docker-compose.yml`), `docker compose up -d` поднимает пустой контейнер заново. `npm run dev` при первом подключении сам создаёт таблицы (`synchronize: true` в `data-source.ts`), а `npm run seed` наполняет их тестовыми данными — 2 города, 2 кухни, 3 пользователя, 1 ресторан с 2 столиками/2 слотами/2 позициями меню.



## Тестовые пользователи (после `npm run seed`)

| Email | Пароль | Роль |
|---|---|---|
| `admin@example.com` | `admin12345` | `ADMIN` |
| `owner@example.com` | `owner12345` | `RESTAURANT_ADMIN` (администратор «Траттория Порто») |
| `guest@example.com` | `guest12345` | `USER` |

## Структура

```
labs/lab1/                               ← папка ЛР1 по маске курса, отчёт лежит рядом
├── .env                                 (настройки окружения: подключение к БД, секрет JWT, префикс API /api/v1)
├── .editorconfig                        (единые правила отступов и кодировки для всех редакторов)
├── .gitignore                           (node_modules, dist, данные базы, локальные файлы Postman)
├── .nvmrc                               (версия Node.js для проекта)
├── .prettierrc                          (правила форматирования кода для npm run format)
├── docker-compose.yml                   (запускает PostgreSQL одной командой docker compose up)
├── package.json                         (зависимости и команды dev, seed, build, start)
├── tsconfig.json                        (настройки компилятора TypeScript, включая декораторы)
├── README.md                            (инструкция запуска проекта)
├── openapi.yaml                         (спецификация API из ДЗ2 — по ней сверяется результат; её же
│                                          раздаёт страница /docs вместо автогенерации из кода)
│
└── src/
    ├── app.ts                           (точка входа: Express, middleware, контроллеры, Swagger, БД)
    ├── swagger.ts                       (отдаёт статический openapi.yaml на /docs через swagger-ui-express)
    │
    ├── config/                          ← настройки и подключения, общие для всего приложения,
    │                                      а не для одного ресурса (БД, переменные окружения)
    │   ├── settings.ts                  (читает переменные среды в одном месте)
    │   └── data-source.ts               (настройка подключения TypeORM к PostgreSQL)
    │
    ├── common/                          ← инфраструктура самих контроллеров (обвязка вокруг
    │                                      routing-controllers), не бизнес-логика конкретного ресурса
    │   ├── base-controller.ts           (базовый класс контроллера с полем repository)
    │   └── entity-controller.ts         (декоратор: делает класс контроллером и подставляет репозиторий)
    │
    ├── models/                          ← плоский список, entity подхватываются по шаблону src/models/*.entity.ts
    │   ├── enums/
    │   │   ├── role.enum.ts             (ADMIN, RESTAURANT_ADMIN, USER)
    │   │   ├── booking-status.enum.ts   (PENDING, CONFIRMED, CANCELLED, COMPLETED)
    │   │   └── menu-category.enum.ts    (APPETIZER, MAIN_COURSE, DESSERT, DRINK)
    │   ├── user.entity.ts               (пользователь: роль, email, хэш пароля, имя, телефон, даты)
    │   ├── user.subscriber.ts           (автоматически хэширует пароль при сохранении пользователя)
    │   ├── city.entity.ts               (справочник городов)
    │   ├── cuisine.entity.ts            (справочник кухонь)
    │   ├── restaurant.entity.ts         (ресторан: средний чек, рейтинг, часы работы)
    │   ├── restaurant-admin.entity.ts   (связь: какие пользователи администрируют какие рестораны)
    │   ├── restaurant-photo.entity.ts   (фотографии ресторана, главное фото и порядок показа)
    │   ├── menu-item.entity.ts          (позиции меню: категория, цена, доступность)
    │   ├── review.entity.ts             (отзывы, оценка от 1 до 5)
    │   ├── restaurant-table.entity.ts   (столики: номер, вместимость, зона)
    │   ├── time-slot.entity.ts          (шаблон временных слотов, например 12:00–14:00)
    │   └── booking.entity.ts            (бронирование: пользователь, столик, слот, дата, гости, статус)
    │
    ├── dto/                             ← «представления»: что принимает и что возвращает API
    │   ├── pagination.dto.ts            (параметры page и limit и форма списка {items, meta})
    │   ├── error.dto.ts                 (единый формат ошибки {statusCode, message, errors?})
    │   ├── auth.dto.ts                  (тела запросов регистрации и входа, ответ с токеном)
    │   ├── user.dto.ts                  (профиль без пароля, тело изменения, короткий UserShortDto)
    │   ├── city.dto.ts                  (тело добавления города)
    │   ├── cuisine.dto.ts               (тело добавления кухни)
    │   ├── restaurant.dto.ts            (список, страница, создание/изменение, фильтры поиска)
    │   ├── restaurant-photo.dto.ts      (фото в ответах и тело добавления)
    │   ├── menu-item.dto.ts             (позиция меню в ответах, тела создания/изменения)
    │   ├── review.dto.ts                (отзыв с краткими данными автора, тела создания/изменения)
    │   ├── restaurant-table.dto.ts      (столик в ответах, тела создания/изменения)
    │   ├── time-slot.dto.ts             (слот в ответах, тела создания/изменения)
    │   ├── availability.dto.ts          (query-параметры поиска и форма ответа со свободными столиками)
    │   ├── restaurant-admin.dto.ts      (назначение администратора ресторана и его данные)
    │   └── booking.dto.ts               (тело создания брони, смена статуса, фильтры списка)
    │
    ├── controllers/                     ← плоский список *.controller.ts, каждый подключается в app.ts
    │   ├── auth.controller.ts           (регистрация и вход, выдача JWT с ролью)
    │   ├── user.controller.ts           (/users/me, /users/me/bookings)
    │   ├── city.controller.ts           (список, добавление и удаление городов)
    │   ├── cuisine.controller.ts        (список, добавление и удаление кухонь)
    │   ├── restaurant.controller.ts     (поиск с фильтрами, страница ресторана, CRUD)
    │   ├── restaurant-admin.controller.ts (назначение и снятие администраторов ресторана)
    │   ├── restaurant-photo.controller.ts (фотографии ресторана)
    │   ├── menu-item.controller.ts      (меню ресторана)
    │   ├── restaurant-table.controller.ts (столики ресторана)
    │   ├── time-slot.controller.ts      (временные слоты ресторана)
    │   ├── availability.controller.ts   (поиск свободных столиков на дату и слот)
    │   ├── booking.controller.ts        (создание брони, список, просмотр, смена статуса)
    │   └── review.controller.ts         (отзывы: список/создание вложены под ресторан, изменение/
    │                                      удаление — под /reviews/{id}; оба маршрута в одном файле
    │                                      через явные полные пути вместо общего baseRoute)
    │
    ├── services/                        ← бизнес-логика, чтобы контроллеры оставались короткими
    │   ├── availability.service.ts      (свободные столики: активные, нужной вместимости, без брони)
    │   ├── booking.service.ts           (проверки при создании брони и допустимые переходы статусов)
    │   ├── review.service.ts            (пересчитывает рейтинг ресторана в одной транзакции)
    │   └── restaurant-access.service.ts (проверяет, что пользователь — админ именно этого ресторана)
    │
    ├── middlewares/                     ← код вокруг контроллера: одни проверяют запрос до него
    │                                      (токен, роль, доступ к ресторану) и могут его прервать,
    │                                      другие перехватывают ошибку уже после
    │   ├── auth.middleware.ts           (проверяет JWT, 401 при отсутствии/невалидности токена)
    │   ├── roles.middleware.ts          (requireRole — пускает дальше только нужные роли, иначе 403)
    │   ├── restaurant-admin.middleware.ts (ADMIN или администратор конкретного ресторана, иначе 403)
    │   └── error-handler.middleware.ts  (любая ошибка → единый формат {statusCode, message, errors?})
    │
    ├── errors/                          ← классы ошибок для throw, которых не хватает из коробки
    │                                      в routing-controllers (там есть 400/401/403/404, но не 409)
    │   └── http-errors.ts               (ConflictError — throw для конфликтов: занятый слот, дубли)
    │
    ├── utils/                           ← маленькие функции без своего состояния, не привязанные
    │                                      к конкретной модели или маршруту, переиспользуемые где угодно
    │   ├── hash-password.ts             (превращает пароль в хэш bcrypt)
    │   ├── check-password.ts            (сравнивает введённый пароль с хэшем)
    │   ├── pagination.ts                (page/limit → skip/take и сборка meta)
    │   ├── numeric-transformer.ts       (numeric-колонки Postgres: строка → число)
    │   ├── time-format.ts               (HH:MM:SS из БД → HH:MM из спецификации)
    │   └── db-errors.ts                 (распознаёт коды ошибок Postgres: 23503 FK, 23505 unique)
    │
    └── seeds/                           ← отдельный скрипт заполнения БД для демонстрации, не часть
                                           работающего сервера — запускается вручную (npm run seed)
        └── seed.ts                      (города, кухни, ресторан со столиками/слотами/меню, 3 пользователя)

```

## Права доступа

- `USER` — обычный пользователь: бронирование, отзывы, свой профиль.
- `RESTAURANT_ADMIN` — администрирует один или несколько ресторанов (назначается через `RestaurantAdmin`).
- `ADMIN` — полный доступ.

## Известные особенности окружения

- `tsx`/esbuild не всегда эмитируют `reflect-metadata` для «голых» декораторов
  (`@Column()`, `@Param()`, `@QueryParams()`) — там, где это важно, тип указан
  явно (`@Column({ type: 'int' })`, `@QueryParams({ type: Dto })`, ручной
  `Number(...)` для path-параметров).
- Документация `/docs` рендерится из статического `openapi.yaml`, а не
  генерируется из кода — автогенератор `routing-controllers-openapi`
  ломается на некоторых декораторах под `tsx`.
