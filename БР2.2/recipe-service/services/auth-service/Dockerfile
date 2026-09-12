# ---- Стадия 1: сборка ----
# Здесь ставятся ВСЕ зависимости (включая dev, они нужны для компиляции TypeScript)
# и компилируется TypeScript в обычный JavaScript
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Стадия 2: запуск ----
# Отдельный, "чистый" образ: только продакшн-зависимости и уже
# скомпилированный код из стадии сборки. Исходники (.ts) и dev-инструменты
# (typescript, ts-node-dev) сюда не попадают — финальный образ меньше весит.
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

# Каталог для sqlite-файла базы данных. В одиночку Docker создал бы его сам
# при подключении volume, но явно — понятнее при чтении Dockerfile.
RUN mkdir -p /app/data

EXPOSE 3001
CMD ["node", "dist/index.js"]
