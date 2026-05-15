FROM node:20-alpine AS builder
WORKDIR /app

COPY common/package*.json ./common/
COPY user/package*.json ./user/

COPY common ./common
COPY user ./user

RUN npm install --prefix ./common
RUN npm install --prefix ./user

WORKDIR /app/common
RUN npm run build

WORKDIR /app/user
RUN npm run build


FROM node:20-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app

COPY common/package*.json ./common/
COPY user/package*.json ./user/

RUN cd common && npm install --omit=dev --omit=optional \
    && cd ../user && npm install --omit=dev --omit=optional

COPY --from=builder /app/common/dist ./common/dist
COPY --from=builder /app/user/dist ./user/dist

WORKDIR /app/user
CMD ["node", "dist/index.js"]