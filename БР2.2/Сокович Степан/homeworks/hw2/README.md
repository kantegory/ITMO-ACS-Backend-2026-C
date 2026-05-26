# ДЗ2 — Проектирование API (аренда жилья)

Минимальный JavaScript-сервис для демонстрации OpenAPI-спецификации в Swagger.

## Запуск

```bash
npm install
npm start
```

## Swagger

- Ссылка: `http://localhost:3000/api-docs`
- Корневой эндпоинт: `http://localhost:3000/`

## Что внутри

- `src/openapi.js` — OpenAPI 3.0.3 спецификация по сущностям из ER-диаграммы
- `src/index.js` — сервер и подключение Swagger UI
- `src/routes.js` — заглушечные эндпоинты без бизнес-логики

