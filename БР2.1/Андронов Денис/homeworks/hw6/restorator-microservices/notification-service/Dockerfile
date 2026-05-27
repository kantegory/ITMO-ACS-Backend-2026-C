FROM node:20-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci

COPY notification-service/package*.json ./notification-service/
RUN cd notification-service && npm ci

COPY shared ./shared
COPY notification-service ./notification-service

WORKDIR /app/notification-service

CMD ["npx", "ts-node", "src/index.ts"]
