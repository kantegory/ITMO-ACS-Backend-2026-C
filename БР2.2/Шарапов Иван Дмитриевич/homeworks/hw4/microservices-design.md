# ДЗ4. Технический дизайн микросервисной архитектуры

Проект: платформа поиска работы. Цель — декомпозировать монолит на микросервисы
по принципу **database-per-service**.

## 1. Выделение сервисов

| Сервис                  | Зона ответственности                                  | Своя БД              |
| ----------------------- | ----------------------------------------------------- | -------------------- |
| **api-gateway**         | Единая точка входа, маршрутизация, проверка JWT       | —                    |
| **auth-service**        | Пользователи, регистрация, вход, выдача JWT           | `auth_db`            |
| **vacancy-service**     | Компании и вакансии, поиск с фильтрацией              | `vacancy_db`         |
| **application-service** | Резюме и отклики на вакансии                          | `application_db`     |
| **notification-service**| Уведомления (потребитель очереди сообщений)           | — (или `notif_db`)   |

Границы выделены по бизнес-доменам (DDD bounded contexts): аутентификация,
вакансии, отклики/резюме, уведомления.

## 2. Схема взаимодействия

```
                 ┌─────────────┐
   Клиент  ─────▶│ api-gateway │
                 └──────┬──────┘
        ┌───────────────┼────────────────┐
        ▼               ▼                ▼
 ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐
 │auth-service│  │vacancy-service│  │ application-service │
 │  auth_db   │  │  vacancy_db   │  │   application_db    │
 └────────────┘  └──────────────┘  └──────────┬──────────┘
                                               │ publish (event)
                                               ▼
                                       ┌───────────────┐
                                       │   RabbitMQ    │
                                       └───────┬───────┘
                                               ▼
                                     ┌──────────────────────┐
                                     │ notification-service │
                                     └──────────────────────┘
```

## 3. Способы взаимодействия

- **Синхронно (HTTP/REST через gateway)** — клиентские запросы.
- **Синхронно (service-to-service REST)** — например, `application-service`
  проверяет существование вакансии, обращаясь к `vacancy-service` по
  внутреннему эндпоинту.
- **Асинхронно (RabbitMQ)** — событие «новый отклик» публикуется
  `application-service` и потребляется `notification-service` (ДЗ5).

## 4. Разделение базы данных

Единая БД монолита разбивается так:

- `auth_db`: таблица `users` (id, email, password_hash, role, ...).
- `vacancy_db`: таблицы `companies`, `vacancies`. Поле `owner_id` хранит
  идентификатор пользователя из `auth_db` (без внешнего ключа между БД —
  ссылочная целостность поддерживается на уровне приложения).
- `application_db`: таблицы `resumes`, `applications`. Хранит `applicant_id`
  (из auth) и `vacancy_id` (из vacancy) как «слабые» ссылки.

Принцип: каждый сервис владеет только своими данными; чужие данные
запрашиваются по API или дублируются минимально необходимым объёмом.

## 5. Межсервисные эндпоинты (внутренние)

Помимо публичного API (см. `openapi.yaml`), вводятся внутренние эндпоинты:

### auth-service (internal)
```
GET /internal/users/{id}        -> { id, email, firstName, lastName, role }
POST /internal/verify-token     body: { token } -> { userId, role } | 401
```

### vacancy-service (internal)
```
GET /internal/vacancies/{id}    -> { id, title, companyId, ownerId } | 404
```

Тело ответов и ошибки соответствуют единому формату:
`{ "message": "..." }` со статусами `400/401/403/404/409/500`.

## 6. Событие в очереди (контракт сообщения)

Очередь `application.created` (exchange типа `direct`):

```json
{
  "event": "application.created",
  "applicationId": 12,
  "vacancyId": 3,
  "vacancyTitle": "Middle Backend Developer",
  "applicantId": 7,
  "employerId": 1,
  "createdAt": "2026-06-28T12:00:00.000Z"
}
```

`notification-service` потребляет сообщение и формирует уведомление
работодателю о новом отклике.

## 7. Шаги декомпозиции

1. Вынести модель `User` и логику auth в `auth-service` с `auth_db`.
2. Вынести `Company`/`Vacancy` в `vacancy-service` с `vacancy_db`.
3. Вынести `Resume`/`Application` в `application-service` с `application_db`.
4. Поднять `api-gateway` (http-proxy) и перенаправить маршруты.
5. Заменить прямые обращения к чужим таблицам на REST-вызовы/события.
6. Подключить RabbitMQ и реализовать `notification-service`.
7. Контейнеризировать каждый сервис и описать `docker-compose.yml`.
