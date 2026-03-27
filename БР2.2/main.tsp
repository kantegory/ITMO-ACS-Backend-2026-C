import "@typespec/http";
import "@typespec/openapi3";

using TypeSpec.Http;

@service()
@server("http://localhost:3000/api", "Локальный сервер")
namespace RecipeApi;

// ------------------------------------ Перечисления ------------------------------------

// Роль пользователя
union Role {
  "user",
  "admin"
}

// Уровень сложности рецепта
union Difficulty {
  "easy",
  "medium",
  "hard"
}

// Статус рецепта (для модерации и публикации)
union RecipeStatus {
  "draft",
  "pending",
  "published",
  "rejected"
}

// ------------------------------------ Модели ------------------------------------

model User {
  id: int32;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: Role;
}

model Category {
  id: int32;
  title: string;
}

model Tag {
  id: int32;
  title: string;
}

model Ingredient {
  name: string;
  quantity: string;
  unit?: string; // единица измерения
}

model Step {
  order: int32; // порядок шага
  description: string;
}

model Recipe {
  id: int32;
  title: string;
  shortDescription: string;
  fullDescription: string;
  difficulty: Difficulty;
  cookingTime: int32;
  author: User;
  category: Category;
  tags: Tag[];
  ingredients: Ingredient[];
  steps: Step[];
  image?: string;

  // статус рецепта
  status: RecipeStatus;

  likesCount: int32; // количество лайков
  isLiked?: boolean; // лайкнул ли текущий пользователь
  isFavorite?: boolean; // в избранном ли
}

model RecipeInput {
  title: string;
  shortDescription: string;
  fullDescription: string;
  difficulty: Difficulty;
  cookingTime: int32;
  categoryId: int32;
  tagIds: int32[];
  ingredients: Ingredient[];
  steps: Step[];
  image?: string;
}

model Comment {
  id: int32;
  text: string;
  user: User;
}

// Единицы измерения (можно расширять)
model Unit {
  id: int32;
  name: string; // "г", "кг", "мл", "л"
}

// модель пагинации
model PaginatedRecipes {
  items: Recipe[]; // список рецептов
  total: int32; // общее количество
  page: int32; // текущая страница
  limit: int32; // количество на странице
}

// Bearer аутентификация
model BearerAuth is Http.BearerAuth;

// ------------------------------------ Эндпоинты ------------------------------------

// -------- Аутентификация --------
@route("/auth")
interface Auth {

  @post
  @route("/register")
  register(
    @body body: {
      username: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    }
  ): User;

  @post
  @route("/login")
  login(
    @body body: {
      email: string;
      password: string;
    }
  ): { token: string };

  // подтверждение email пользователя
  @post
  @route("/verify-email")
  verifyEmail(
    @body body: {
      token: string;
    }
  ): void;
}

// -------- Пользователи --------
@route("/users")
interface Users {

  @get
  @route("/me")
  @useAuth(BearerAuth)
  me(): User;

  // Обновление профиля пользователя
  @put
  @route("/me")
  @useAuth(BearerAuth)
  updateMe(
    @body body: {
      username?: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    }
  ): User;

  @get
  @route("/me/recipes")
  @useAuth(BearerAuth)
  myRecipes(): Recipe[]; // список моих рецептов

  @get
  @route("/me/favorites")
  @useAuth(BearerAuth)
  myFavorites(): Recipe[]; // список избранных рецептов
}

// -------- Рецепты --------
@route("/recipes")
interface Recipes {

  @get
  list(
    @query search?: string, // поиск по названию
    @query categoryId?: int32, // фильтр по категории
    @query difficulty?: Difficulty, // фильтр по сложности
    @query cookingTime?: int32, // фильтр по времени
    @query tagId?: int32, // фильтр по тегу

    // Сортировка
    @query sortBy?: "difficulty" | "popularity",
    @query order?: "asc" | "desc",

    // Пагинация
    @query page?: int32,
    @query limit?: int32
  ): PaginatedRecipes;

  @get
  @route("/{id}")
  get(@path id: int32): Recipe;

  @post
  @useAuth(BearerAuth)
  create(@body body: RecipeInput): Recipe;

  @put
  @route("/{id}")
  @useAuth(BearerAuth)
  update(@path id: int32, @body body: RecipeInput): Recipe;

  @delete
  @route("/{id}")
  @useAuth(BearerAuth)
  delete(@path id: int32): void;

  // Отправка рецепта на модерацию
  @post
  @route("/{id}/submit")
  @useAuth(BearerAuth)
  submit(@path id: int32): Recipe;

  // Лайки
  @post
  @route("/{id}/like")
  @useAuth(BearerAuth)
  like(@path id: int32): void;

  @delete
  @route("/{id}/like")
  @useAuth(BearerAuth)
  unlike(@path id: int32): void;

  // Избранное
  @post
  @route("/{id}/favorite")
  @useAuth(BearerAuth)
  favorite(@path id: int32): void;

  @delete
  @route("/{id}/favorite")
  @useAuth(BearerAuth)
  unfavorite(@path id: int32): void;
}

// -------- Админ--------
@route("/admin")
interface Admin {

  // Модерация рецептов администратором
  @put
  @route("/recipes/{id}/approve")
  @useAuth(BearerAuth)
  approveRecipe(@path id: int32): Recipe;

  @put
  @route("/recipes/{id}/reject")
  @useAuth(BearerAuth)
  rejectRecipe(@path id: int32): Recipe;

  @delete
  @route("/recipes/{id}")
  @useAuth(BearerAuth)
  deleteRecipe(@path id: int32): void;

  // Удаление комментариев администратором
  @delete
  @route("/comments/{id}")
  @useAuth(BearerAuth)
  deleteComment(@path id: int32): void;
}

// -------- Коммментарии --------
@route("/comments")
interface Comments {

  @get
  @route("/recipe/{recipeId}")
  list(@path recipeId: int32): Comment[];

  @post
  @route("/recipe/{recipeId}")
  @useAuth(BearerAuth)
  add(
    @path recipeId: int32,
    @body body: { text: string }
  ): Comment;

  @delete
  @route("/{id}")
  @useAuth(BearerAuth)
  delete(@path id: int32): void;
}

// -------- Ингредиенты --------
@route("/ingredients")
interface Ingredients {

  @get
  list(
    @query search?: string // поиск по названию ингредиента
  ): Ingredient[];
}

// -------- Units --------
@route("/units")
interface Units {

  @get
  list(): Unit[]; // список единиц измерения
}