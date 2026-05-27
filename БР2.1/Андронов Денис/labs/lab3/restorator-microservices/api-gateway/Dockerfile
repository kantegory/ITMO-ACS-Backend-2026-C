FROM node:20-alpine

WORKDIR /app/api-gateway

COPY api-gateway/package*.json ./
RUN npm ci

COPY api-gateway ./

EXPOSE 4000

CMD ["npx", "ts-node", "src/index.ts"]
