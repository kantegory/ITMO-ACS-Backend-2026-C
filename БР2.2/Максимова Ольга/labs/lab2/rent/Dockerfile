FROM node:20-alpine AS builder
WORKDIR /app

COPY common/package*.json ./common/
COPY rent/package*.json ./rent/

COPY common ./common
COPY rent ./rent

RUN npm install --prefix ./common
RUN npm install --prefix ./rent

WORKDIR /app/common
RUN npm run build

WORKDIR /app/rent
RUN npm run build


FROM node:20-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY common/package*.json ./common/
COPY rent/package*.json ./rent/

RUN cd common && npm install --omit=dev --omit=optional \
    && cd ../rent && npm install --omit=dev --omit=optional

COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/rent/dist ./rent/dist

WORKDIR /app/rent
CMD ["node", "dist/index.js"]