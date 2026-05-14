/**
 * A sequence of textual characters.
 */
export type String = string;
export interface User {
  id: number;
  role: UserRole;
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  createdAt: number;
  updatedAt: number;
  photoUrl?: string;
  subscriptions?: Array<Subscription>;
  myRecipes?: Array<Recipe>;
  savedRecipes?: Array<SavedRecipe>;
  likedRecipes?: Array<GradeRecipe>;
  dislikedRecipes?: Array<GradeRecipe>;
}
/**
 * A 32-bit integer. (`-2,147,483,648` to `2,147,483,647`)
 */
export type Int32 = number;
/**
 * A 64-bit integer. (`-9,223,372,036,854,775,808` to `9,223,372,036,854,775,807`)
 */
export type Int64 = bigint;
/**
 * A whole number. This represent any `integer` value possible.
 * It is commonly represented as `BigInteger` in some languages.
 */
export type Integer = number;
/**
 * A numeric type
 */
export type Numeric = number;
export enum UserRole {
  Admin = "ADMIN",
  Author = "AUTHOR"
}
/**
 * Boolean with `true` and `false` values.
 */
export type Boolean = boolean;
export interface Subscription {
  id: number;
  followerId: number;
  authorId: number;
  authorLogin: string;
  authorPhotoUrl?: string;
  createdAt: number;
}
export interface Recipe {
  id: number;
  authorId: number;
  typeId: number;
  cuisineId: number;
  title: string;
  desc: string;
  imageUrl: string;
  videoUrl?: string;
  cookTime: number;
  isPublished: boolean;
  createdAt: number;
  updatedAt: number;
  peopleAmount: number;
  steps: Array<Step>;
  ingredients: Array<Ingredient>;
  comments?: Array<Comment>;
  likes: number;
  dislikes: number;
  saves: number;
}
/**
 * A 16-bit integer. (`-32,768` to `32,767`)
 */
export type Int16 = number;
export interface Step {
  recipeId: number;
  imageUrl: string;
  text: string;
  number: number;
}
export interface Ingredient {
  id: number;
  name: string;
  amount: number;
  unit: Units;
}
export enum Units {
  Gram = "GRAM",
  Ml = "ML",
  Piece = "PIECE",
  Tbspoon = "TBSPOON",
  Teaspoon = "TEASPOON",
  Thing = "THING"
}
export interface Comment {
  recipeId: number;
  userId: number;
  text: string;
  createdAt: number;
}
export interface SavedRecipe extends RecipeCard {
  id: number;
  userId: number;
  recipeId: number;
  createdAt: number;
}
export interface RecipeCard {
  recipeId: number;
  authorId: number;
  typeId: number;
  cuisineId: number;
  title: string;
  desc: string;
  imageUrl: string;
  cookTime: number;
  createdAt: number;
  ingredients: Array<Ingredient>;
  likes: number;
  dislikes: number;
  saves: number;
}
export interface GradeRecipe extends RecipeCard {
  id: number;
  userId: number;
  recipeId: number;
  createdAt: number;
  type: Grade;
}
export enum Grade {
  Like = "LIKE",
  Dislike = "DISLIKE"
}
export interface UnauthorizedError extends Error {
  code: 401;
  message: "Unauthorized: Invalid credentials or session expired";
}
export interface Error {
  code: number;
  message: string;
  exception?: string;
  excType?: string;
}
export interface ConflictError extends Error {
  code: 409;
  message: "Conflict: Duplicate resource or constraint violation";
}
export interface ValidationError extends Error {
  code: 422;
  message: "Validation failed for the provided data";
}
export interface ForbiddenError extends Error {
  code: 403;
  message: "Forbidden: You do not have permission";
}
export interface NotFoundError extends Error {
  code: 404;
  message: "Not Found: Resource doesn't exist";
}
export interface ServerError extends Error {
  code: 500;
  message: "Internal server error occurred";
}
export interface Page {
  items: Array<Comment>;
  total: number;
  page: number;
  limit: number;
}
export interface Page_2 {
  items: Array<RecipeCard>;
  total: number;
  page: number;
  limit: number;
}
export interface CreateRecipe {
  typeId: number;
  cuisineId: number;
  title: string;
  desc: string;
  imageUrl: string;
  videoUrl?: string;
  cookTime: number;
  peopleAmount: number;
  steps: Array<Step>;
  ingredients: Array<Ingredient>;
  isPublished: boolean;
}
export interface Page_3 {
  items: Array<{
    id: number;
    followerId: number;
    authorId: number;
    authorLogin: string;
    authorPhotoUrl?: string;
    createdAt: number;
    author: User;
  }>;
  total: number;
  page: number;
  limit: number;
}
export interface Page_4 {
  items: Array<SavedRecipe>;
  total: number;
  page: number;
  limit: number;
}
export interface Page_5 {
  items: Array<GradeRecipe>;
  total: number;
  page: number;
  limit: number;
}
