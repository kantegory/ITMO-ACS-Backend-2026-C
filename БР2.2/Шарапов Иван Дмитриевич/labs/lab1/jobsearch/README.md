# JobSearch Backend — платформа поиска работы

Учебный проект по курсу «Бэкенд-разработка (общий курс) 2026», ИТМО.
Вариант №2 — **Сайт для поиска работы**.

Стек: **Node.js + TypeScript + Express + TypeORM + PostgreSQL + JWT + Swagger**.

## Возможности

- Регистрация и вход (JWT), роли `applicant` / `employer`
- Личный кабинет соискателя с резюме
- Кабинет работодателя: компании и вакансии
- Поиск вакансий с фильтрацией (отрасль, зарплата, опыт, тип занятости, локация, текст)
- Страница вакансии (описание, требования, компания)
- Отклики на вакансии и управление их статусами

## Структура

```
src/
  entities/      # модели TypeORM (User, Resume, Company, Vacancy, Application)
  controllers/   # бизнес-логика эндпоинтов
  middleware/    # auth (JWT), обработка ошибок
  routes/        # маршруты Express
  utils/         # JWT-хелперы
  data-source.ts # конфигурация подключения к БД
  app.ts         # сборка приложения Express
  index.ts       # точка входа
  seed.ts        # тестовые данные
openapi.yaml     # спецификация API (ДЗ2)
docs/erd.mermaid # ERD-диаграмма БД (ДЗ1)
```

## Запуск локально

1. Установить зависимости:
   ```bash
   npm install
   ```
2. Создать `.env` из примера и указать доступы к PostgreSQL:
   ```bash
   cp .env.example .env
   ```
3. Поднять PostgreSQL (или через Docker):
   ```bash
   docker run --name jobsearch-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobsearch -p 5432:5432 -d postgres:16
   ```
4. Запустить в dev-режиме (таблицы создаются автоматически через `synchronize`):
   ```bash
   npm run dev
   ```
5. (Опционально) Загрузить тестовые данные:
   ```bash
   npm run seed
   ```

Приложение: `http://localhost:3000`, Swagger UI: `http://localhost:3000/api/docs`.

## Тестовые учётные записи (после seed)

| Роль          | Email                  | Пароль       |
| ------------- | ---------------------- | ------------ |
| Работодатель  | employer@example.com   | password123  |
| Соискатель    | applicant@example.com  | password123  |

## Сборка для продакшена

```bash
npm run build
npm start
```
