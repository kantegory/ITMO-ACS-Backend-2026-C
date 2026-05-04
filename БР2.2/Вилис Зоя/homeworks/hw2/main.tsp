import "@typespec/http";

using Http;
@service(#{ title: "Venus' Vegetarian Ward" })
namespace VegetarianWard;

enum UserRole {
  Admin;
  User;
}

model User {
  id: int32;
  role: UserRole;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  profile_pic?: string;
  is_verified: boolean;
  created_at: plainDate;
  // saved_recipe: SavedRecipe[];
}

model SavedRecipe {
  id: int32;
  recipe: Recipe;
  saved_by: User;
  saved_at: plainDate;
}

model PublishedRecipe {
  id: int32;
  recipe: Recipe;
  is_mine: boolean;
  published_at: plainDate;
}

model Recipe {
  id: int32;
  title: string;
  description: string;
  step: Step[];
  rating: float;
  published_at: plainDate;
  author: User;
  ingredient: RecipeIngredient[];
  skill: Skill;
  category: Category[];
}

model RecipeData {
  title: string;
  description: string;
  step: Step[];
  ingredient: RecipeIngredient[];
  skill: Skill;
  category: Category[];
}

model Ingredient {
  id: int32;
  name: string;
}

model Skill {
  id: int32;
  level: string;
}

model Category {
  id: int32;
  title: string;
}

model RecipeIngredient {
  id: int32;
  amount: float;
  unit?: Unit;
  ingredient: Ingredient;
  recipe: Recipe;
}

enum Unit {
  g;
  lbs;
  ml;
  tsp;
  tbsp;
  cup;
  pcs;
}

model Comment {
  id: int32;
  comment_body: string;
  published_at: plainDate;
  author: User;
  recipe: Recipe;
}

model Step {
  id: int32;
  instruction: string;
  image?: string;
  recipe: Recipe;
}

model RegisterRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  profile_pic: string;
}

model LoginRequest {
  email: string;
  password: string;
}

model LoginResponse {
  token: string;
  user: User;
}

enum SortBy{
  title,
  skill,
  rating,
  created_at,
}

enum SortHow {
  asc,
  desc,
}



@route("/api/auth")
@tag("Auth")
interface Auth {
  @route("/register") 
    @post op register(@body body: RegisterRequest): LoginResponse;
  @route("/login") 
    @post op login(@body body: LoginRequest): LoginResponse;
  @route("/logout") @post op logout(token: string): void;
}


@route("/api/users")
@tag("User")
interface Users {
  @get op users_list(@query role: UserRole): User[];
  @route("/{id}")
    @get op get_user(@path id: int32): User;
    @put @useAuth(BearerAuth) op update_user(@path id: int32, @body user: User): User;
  @route("/{id}/recipes/saved")
    @get op saved_recipes(@path id: int32): SavedRecipe[];
  @route("/{id}/recipes/saved/{recipe_id}")
    @delete @useAuth(BearerAuth) op remove_recipe(@path id: int32, @path recipe_id: int32): void;
  @route("/{id}/recipes/published")
    @get op published_recipes(@path id: int32): PublishedRecipe[];
  @route("/{id}/recipes/published/{recipe_id}")
    @put @useAuth(BearerAuth) op update_recipe(@path id: int32, @path recipe_id: int32, @body body: RecipeData): Recipe;
    @delete @useAuth(BearerAuth) op delete_recipe(@path id: int32, @path recipe_id: int32): void;
}

@route("api/recipes")
@tag("Recipes")
interface Recipes {
  @get op recipe_list(@query title?: string, @query ingredient?: Ingredient, @query skill?: Skill,@query category?: Category, @query sortBy?: SortBy, @query sortDirection: SortHow): Recipe[];
  @post @useAuth(BearerAuth) op new_recipe(@body data: RecipeData): Recipe;
  @route("/{id}")
    @get op get_recipe(@path id: int32): Recipe;
}

@route("/api/comments")
@tag("Comments")
interface Comments {
  @route("/{recipe_id}")
    @get op comment_list(@path recipe_id: int32): Comment[];
    @post @useAuth(BearerAuth) op add_comment(@path recipe_id: int32, @body body: { comment_body: string }
  ): Comment;
  @route("/{id}") 
    @delete @useAuth(BearerAuth) op delete(@path id: int32): void;
}