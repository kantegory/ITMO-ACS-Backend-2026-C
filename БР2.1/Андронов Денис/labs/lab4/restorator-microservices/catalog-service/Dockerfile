FROM node:20-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci

COPY catalog-service/package*.json ./catalog-service/
RUN cd catalog-service && npm ci

COPY shared ./shared
COPY catalog-service ./catalog-service

WORKDIR /app/catalog-service

EXPOSE 4002

CMD ["npx", "ts-node", "src/index.ts"]
