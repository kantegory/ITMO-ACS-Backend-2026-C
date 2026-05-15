FROM node:20-alpine AS builder
WORKDIR /app

COPY common/package*.json ./common/
COPY payment/package*.json ./payment/

COPY common ./common
COPY payment ./payment

RUN npm install --prefix ./common
RUN npm install --prefix ./payment

WORKDIR /app/common
RUN npm run build

WORKDIR /app/payment
RUN npm run build


FROM node:20-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY common/package*.json ./common/
COPY payment/package*.json ./payment/

RUN cd common && npm install --omit=dev --omit=optional \
    && cd ../payment && npm install --omit=dev --omit=optional

COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/payment/dist ./payment/dist

WORKDIR /app/payment
CMD ["node", "dist/index.js"]