const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "API сервиса аренды жилья",
    version: "1.0.0",
    description:
      "Спецификация API сервиса аренды жилья.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Локальный сервер",
    },
  ],
  tags: [
    { name: "Авторизация", description: "Аутентификация и регистрация" },
    { name: "Пользователи", description: "Управление данными пользователей" },
    { name: "Недвижимость", description: "Управление объектами недвижимости" },
    { name: "Сделки", description: "Жизненный цикл сделок аренды" },
    { name: "Чаты", description: "Чаты между арендодателем и арендатором" },
    { name: "Отзывы", description: "Отзывы пользователей" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Авторизация"],
        summary: "Регистрация нового пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Пользователь зарегистрирован",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Авторизация"],
        summary: "Вход пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Успешный вход",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/users": {
      get: {
        tags: ["Пользователи"],
        summary: "Получить список пользователей",
        parameters: [
          { name: "type", in: "query", schema: { $ref: "#/components/schemas/UserRole" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          200: {
            description: "Список пользователей",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/User" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Пользователи"],
        summary: "Создать пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Пользователь создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/users/{id}": {
      get: {
        tags: ["Пользователи"],
        summary: "Получить пользователя по ID",
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        responses: {
          200: {
            description: "Данные пользователя",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Пользователи"],
        summary: "Полная замена данных пользователя",
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateUserRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Пользователь обновлен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      patch: {
        tags: ["Пользователи"],
        summary: "Частичное обновление данных пользователя",
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatchUserRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Пользователь частично обновлен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/properties": {
      get: {
        tags: ["Недвижимость"],
        summary: "Поиск объектов недвижимости",
        parameters: [
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "typeId", in: "query", schema: { type: "integer" } },
          { name: "minPrice", in: "query", schema: { type: "integer" } },
          { name: "maxPrice", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: {
          200: {
            description: "Список объектов недвижимости",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Property" },
                    },
                    total: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Недвижимость"],
        summary: "Создать объект недвижимости",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePropertyRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Объект недвижимости создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Property" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/properties/{id}": {
      get: {
        tags: ["Недвижимость"],
        summary: "Получить объект недвижимости по ID",
        parameters: [{ $ref: "#/components/parameters/PropertyId" }],
        responses: {
          200: {
            description: "Данные объекта недвижимости",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PropertyDetails" },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/properties/{id}/photos": {
      post: {
        tags: ["Недвижимость"],
        summary: "Добавить фото к объекту по ID",
        parameters: [{ $ref: "#/components/parameters/PropertyId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePhotoRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Фото добавлено",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Photo" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/deals": {
      get: {
        tags: ["Сделки"],
        summary: "Получить список сделок",
        responses: {
          200: {
            description: "Список сделок",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Deal" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Сделки"],
        summary: "Создать заявку на сделку",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateDealRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Сделка создана",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Deal" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/deals/{id}/status": {
      patch: {
        tags: ["Сделки"],
        summary: "Обновить статус сделки",
        parameters: [{ $ref: "#/components/parameters/DealId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateDealStatusRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Статус сделки обновлен",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Deal" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/chats": {
      get: {
        tags: ["Чаты"],
        summary: "Получить чаты пользователя",
        responses: {
          200: {
            description: "Список чатов",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Chat" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Чаты"],
        summary: "Создать чат между пользователями",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateChatRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Чат создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Chat" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/chats/{id}/messages": {
      get: {
        tags: ["Чаты"],
        summary: "Получить сообщения чата",
        parameters: [{ $ref: "#/components/parameters/ChatId" }],
        responses: {
          200: {
            description: "Список сообщений",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Message" },
                    },
                  },
                },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      post: {
        tags: ["Чаты"],
        summary: "Отправить сообщение в чат",
        parameters: [{ $ref: "#/components/parameters/ChatId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateMessageRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Сообщение отправлено",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Message" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/messages/{id}": {
      patch: {
        tags: ["Чаты"],
        summary: "Редактировать текст сообщения",
        parameters: [{ $ref: "#/components/parameters/MessageId" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateMessageRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Сообщение обновлено",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Message" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/reviews": {
      post: {
        tags: ["Отзывы"],
        summary: "Создать отзыв",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateReviewRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Отзыв создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Review" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/users/{id}/reviews": {
      get: {
        tags: ["Отзывы"],
        summary: "Получить отзывы пользователя",
        parameters: [{ $ref: "#/components/parameters/UserId" }],
        responses: {
          200: {
            description: "Список отзывов",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Review" },
                    },
                  },
                },
              },
            },
          },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
  components: {
    parameters: {
      UserId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
      PropertyId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
      DealId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
      ChatId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
      MessageId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer" },
      },
    },
    responses: {
      BadRequest: {
        description: "Ошибка валидации",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Unauthorized: {
        description: "Не авторизован",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      NotFound: {
        description: "Сущность не найдена",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
      Conflict: {
        description: "Конфликт текущего состояния",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
    schemas: {
      UserRole: {
        type: "string",
        enum: ["tenant", "landlord"],
      },
      DealStatus: {
        type: "string",
        enum: ["запрошена", "подтверждена", "отменена"],
      },
      MessageStatus: {
        type: "string",
        enum: ["отправлено", "получено", "прочитано"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
        },
        required: ["message", "code"],
      },
      RegisterRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          password: { type: "string", minLength: 6 },
          type: { $ref: "#/components/schemas/UserRole" },
        },
        required: ["name", "email", "password", "type"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
        required: ["email", "password"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
        required: ["token", "user"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          type: { $ref: "#/components/schemas/UserRole" },
        },
        required: ["id", "name", "email", "type"],
      },
      CreateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          password: { type: "string", minLength: 6 },
          type: { $ref: "#/components/schemas/UserRole" },
        },
        required: ["name", "email", "password", "type"],
      },
      UpdateUserRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          type: { $ref: "#/components/schemas/UserRole" },
        },
        required: ["name", "email", "type"],
      },
      PatchUserRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          type: { $ref: "#/components/schemas/UserRole" },
        },
      },
      EstateType: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
        },
        required: ["id", "name"],
      },
      Photo: {
        type: "object",
        properties: {
          id: { type: "integer" },
          propertyId: { type: "integer" },
          photoAddr: { type: "string" },
        },
        required: ["id", "propertyId", "photoAddr"],
      },
      CreatePhotoRequest: {
        type: "object",
        properties: {
          photoAddr: { type: "string" },
        },
        required: ["photoAddr"],
      },
      Property: {
        type: "object",
        properties: {
          id: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          name: { type: "string" },
          price: { type: "integer" },
          deposit: { type: "integer" },
          description: { type: "string" },
          ownerId: { type: "integer" },
          city: { type: "string" },
          address: { type: "string" },
          typeId: { type: "integer" },
        },
        required: ["id", "name", "price", "ownerId", "city", "typeId"],
      },
      PropertyDetails: {
        allOf: [
          { $ref: "#/components/schemas/Property" },
          {
            type: "object",
            properties: {
              type: { $ref: "#/components/schemas/EstateType" },
              photos: {
                type: "array",
                items: { $ref: "#/components/schemas/Photo" },
              },
            },
          },
        ],
      },
      CreatePropertyRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "integer" },
          deposit: { type: "integer" },
          description: { type: "string" },
          city: { type: "string" },
          address: { type: "string" },
          typeId: { type: "integer" },
        },
        required: ["name", "price", "city", "address", "typeId"],
      },
      Deal: {
        type: "object",
        properties: {
          id: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          landlordId: { type: "integer" },
          tenantId: { type: "integer" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          estateId: { type: "integer" },
          status: { $ref: "#/components/schemas/DealStatus" },
        },
        required: ["id", "landlordId", "tenantId", "estateId", "status"],
      },
      CreateDealRequest: {
        type: "object",
        properties: {
          estateId: { type: "integer" },
          landlordId: { type: "integer" },
          tenantId: { type: "integer" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
        },
        required: ["estateId", "landlordId", "tenantId", "startTime", "endTime"],
      },
      UpdateDealStatusRequest: {
        type: "object",
        properties: {
          status: { $ref: "#/components/schemas/DealStatus" },
        },
        required: ["status"],
      },
      Chat: {
        type: "object",
        properties: {
          id: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          user1Id: { type: "integer" },
          user2Id: { type: "integer" },
        },
        required: ["id", "user1Id", "user2Id"],
      },
      CreateChatRequest: {
        type: "object",
        properties: {
          user1Id: { type: "integer" },
          user2Id: { type: "integer" },
        },
        required: ["user1Id", "user2Id"],
      },
      Message: {
        type: "object",
        properties: {
          id: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          text: { type: "string" },
          sentBy: { type: "integer" },
          status: { $ref: "#/components/schemas/MessageStatus" },
          edited: { type: "boolean" },
          chatId: { type: "integer" },
        },
        required: ["id", "text", "sentBy", "status", "chatId"],
      },
      CreateMessageRequest: {
        type: "object",
        properties: {
          text: { type: "string" },
          sentBy: { type: "integer" },
        },
        required: ["text", "sentBy"],
      },
      UpdateMessageRequest: {
        type: "object",
        properties: {
          text: { type: "string" },
        },
        required: ["text"],
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "integer" },
          authorId: { type: "integer" },
          targetId: { type: "integer" },
          rating: { type: "number", minimum: 0, maximum: 5 },
          createdAt: { type: "string", format: "date-time" },
          text: { type: "string" },
        },
        required: ["id", "authorId", "targetId", "rating"],
      },
      CreateReviewRequest: {
        type: "object",
        properties: {
          targetId: { type: "integer" },
          rating: { type: "number", minimum: 0, maximum: 5 },
          text: { type: "string" },
        },
        required: ["targetId", "rating"],
      },
    },
  },
};

module.exports = { openApiSpec };

