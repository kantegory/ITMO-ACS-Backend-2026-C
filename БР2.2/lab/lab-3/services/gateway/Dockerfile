# Единственный из 4 Dockerfile, который собирается с контекстом = корень
# всего проекта (см. docker-compose.yml: context: . / dockerfile: services/gateway/Dockerfile),
# а не из своей собственной папки. Причина — Gateway нужен файл openapi.yaml,
# который лежит на уровень выше папки services/, а Docker не даёт обращаться
# к файлам за пределами контекста сборки.

# ---- Стадия 1: сборка ----
FROM node:20-alpine AS build
WORKDIR /app

COPY services/gateway/package*.json ./
RUN npm install

COPY services/gateway/tsconfig.json ./
COPY services/gateway/src ./src
RUN npm run build

# ---- Стадия 2: запуск ----
FROM node:20-alpine
WORKDIR /app

COPY services/gateway/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist
COPY openapi.yaml ./openapi.yaml

ENV OPENAPI_PATH=/app/openapi.yaml

EXPOSE 3000
CMD ["node", "dist/index.js"]
