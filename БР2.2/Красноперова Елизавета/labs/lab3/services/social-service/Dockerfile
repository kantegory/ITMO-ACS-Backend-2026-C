FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY services/user-service/package.json services/user-service/package.json
COPY services/recipe-service/package.json services/recipe-service/package.json
COPY services/social-service/package.json services/social-service/package.json

RUN npm ci

COPY services/social-service services/social-service

RUN npm run build -w social-service

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY services/api-gateway/package.json services/api-gateway/package.json
COPY services/user-service/package.json services/user-service/package.json
COPY services/recipe-service/package.json services/recipe-service/package.json
COPY services/social-service/package.json services/social-service/package.json

RUN npm ci --omit=dev

COPY --from=builder /app/services/social-service/dist services/social-service/dist

CMD ["node", "services/social-service/dist/index.js"]
