FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY shared/package*.json ./shared/
RUN cd shared && npm ci

COPY auth-service/package*.json ./auth-service/
RUN cd auth-service && npm ci

COPY shared ./shared
COPY auth-service ./auth-service

WORKDIR /app/auth-service

EXPOSE 4001

CMD ["npx", "ts-node", "src/index.ts"]
