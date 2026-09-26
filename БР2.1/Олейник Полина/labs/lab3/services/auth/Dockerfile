# Стадия сборки: ставим все зависимости и компилируем TypeScript в JS (dist/)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Финальный образ: только прод-зависимости и уже собранный JS, без исходников
# и dev-инструментов (typescript, tsx и т.п.) — меньше и безопаснее.
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/app.js"]
