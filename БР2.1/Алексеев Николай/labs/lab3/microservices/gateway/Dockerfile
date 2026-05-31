FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

COPY src/openapi.yaml ./dist/openapi.yaml

EXPOSE 8000

CMD ["node", "dist/index.js"]