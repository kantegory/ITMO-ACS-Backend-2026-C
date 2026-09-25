FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY services/user-service/package.json services/user-service/package.json
COPY services/recipe-service/package.json services/recipe-service/package.json
COPY services/social-service/package.json services/social-service/package.json

RUN npm ci

COPY services/api-gateway services/api-gateway

RUN npm run build -w api-gateway

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY services/user-service/package.json services/user-service/package.json
COPY services/recipe-service/package.json services/recipe-service/package.json
COPY services/social-service/package.json services/social-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/api-gateway/dist services/api-gateway/dist

CMD ["node", "services/api-gateway/dist/index.js"]
