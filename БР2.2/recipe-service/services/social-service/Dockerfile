# ---- Стадия 1: сборка ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Стадия 2: запуск ----
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data

EXPOSE 3003
CMD ["node", "dist/index.js"]
