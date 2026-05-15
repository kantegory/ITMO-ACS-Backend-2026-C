FROM node:20-alpine AS builder
WORKDIR /app

COPY common/package*.json ./common/
COPY message/package*.json ./message/

COPY common ./common
COPY message ./message

RUN npm install --prefix ./common
RUN npm install --prefix ./message

WORKDIR /app/common
RUN npm run build

WORKDIR /app/message
RUN npm run build


FROM node:20-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY common/package*.json ./common/
COPY message/package*.json ./message/

RUN cd common && npm install --omit=dev --omit=optional \
    && cd ../message && npm install --omit=dev --omit=optional

COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/message/dist ./message/dist

WORKDIR /app/message
CMD ["node", "dist/index.js"]