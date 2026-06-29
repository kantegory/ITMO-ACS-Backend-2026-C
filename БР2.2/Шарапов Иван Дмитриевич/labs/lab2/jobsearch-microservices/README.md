# JobSearch — микросервисная версия

Декомпозиция монолита на микросервисы (ЛР2–ЛР3, ДЗ4–ДЗ5).

## Сервисы

| Сервис                | Порт | БД              | Назначение                          |
| --------------------- | ---- | --------------- | ----------------------------------- |
| gateway               | 3000 | —               | API Gateway, маршрутизация          |
| auth-service          | 3001 | auth_db         | Пользователи, JWT                   |
| vacancy-service       | 3002 | vacancy_db      | Компании, вакансии, поиск           |
| application-service   | 3003 | application_db  | Резюме, отклики, publish в RabbitMQ |
| notification-service  | —    | —               | Потребитель очереди уведомлений     |

Инфраструктура: PostgreSQL (три БД), RabbitMQ (порт 5672, UI 15672).

## Запуск через Docker Compose

```bash
docker compose up --build
```

Точка входа: `http://localhost:3000/api`
RabbitMQ UI: `http://localhost:15672` (guest / guest)

## Проверка сценария

```bash
# регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.ru","password":"password123","firstName":"A","lastName":"B","role":"applicant"}'

# вход -> взять token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.ru","password":"password123"}'

# поиск вакансий
curl "http://localhost:3000/api/vacancies?industry=IT"
```

При отклике на вакансию `application-service` публикует событие
`application.created` в RabbitMQ, а `notification-service` логирует уведомление
работодателю (см. `docker compose logs notification-service`).

## Локальный запуск без Docker

В каждом сервисе: `npm install && npm run dev`. Нужны запущенные PostgreSQL и
RabbitMQ, а также переменные окружения (см. `docker-compose.yml`).
