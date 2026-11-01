FROM node:22-alpine
WORKDIR /course/labs/lab1
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
CMD ["npm", "start"]
