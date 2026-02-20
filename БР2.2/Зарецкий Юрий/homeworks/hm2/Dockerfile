FROM node:20-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm install

# Копируем исходные файлы TypeSpec
COPY . .

# Компилируем TypeSpec в OpenAPI
RUN npm run build

# Открываем порт
EXPOSE 8000

# Запускаем сервер
CMD ["npm", "start"]
