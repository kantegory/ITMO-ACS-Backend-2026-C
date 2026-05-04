FROM node:20-alpine AS builder
WORKDIR /app

COPY common/package*.json ./common/
COPY accommodation/package*.json ./accommodation/

COPY common ./common
COPY accommodation ./accommodation

RUN npm install --prefix ./common
RUN npm install --prefix ./accommodation

WORKDIR /app/common
RUN npm run build

WORKDIR /app/accommodation
RUN npm run build


FROM node:20-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY common/package*.json ./common/
COPY accommodation/package*.json ./accommodation/

RUN cd common && npm install --omit=dev --omit=optional \
    && cd ../accommodation && npm install --omit=dev --omit=optional

COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/accommodation/dist ./accommodation/dist

WORKDIR /app/accommodation
CMD ["node", "dist/index.js"]