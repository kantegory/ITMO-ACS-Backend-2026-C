FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY services/user-service/package.json services/user-service/package.json
COPY services/recipe-service/package.json services/recipe-service/package.json
COPY services/social-service/package.json services/social-service/package.json

RUN npm ci

COPY services/user-service services/user-service

RUN npm run build -w user-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY services/user-service/package.json services/user-service/package.json
COPY services/recipe-service/package.json services/recipe-service/package.json
COPY services/social-service/package.json services/social-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/user-service/dist services/user-service/dist

CMD ["node", "services/user-service/dist/index.js"]
