FROM node:20-alpine

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci

COPY booking-service/package*.json ./booking-service/
RUN cd booking-service && npm ci

COPY shared ./shared
COPY booking-service ./booking-service

WORKDIR /app/booking-service

EXPOSE 4003

CMD ["npx", "ts-node", "src/index.ts"]
