import type { Comment, ConflictError, CreateRecipe, Error, ForbiddenError, GradeRecipe, Ingredient, NotFoundError, Page, Page_2, Page_3, Page_4, Page_5, Recipe, RecipeCard, SavedRecipe, ServerError, Step, Subscription, UnauthorizedError, User, ValidationError } from "../models.js";

export function decodeBase64(value: string): Uint8Array | undefined {
  if(!value) {
    return value as any;
  }
  // Normalize Base64URL to Base64
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(value.length + (4 - (value.length % 4)) % 4, '=');

  return new Uint8Array(Buffer.from(base64, 'base64'));
}export function encodeUint8Array(
  value: Uint8Array | undefined | null,
  encoding: BufferEncoding,
): string | undefined {
  if (!value) {
    return value as any;
  }
  return Buffer.from(value).toString(encoding);
}export function dateDeserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc7231Deserializer(date?: string | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date);
}export function dateRfc3339Serializer(date?: Date | null): string {
  if (!date) {
    return date as any
  }

  return date.toISOString();
}export function dateRfc7231Serializer(date?: Date | null): string {
  if (!date) {
    return date as any;
  }

  return date.toUTCString();
}export function dateUnixTimestampSerializer(date?: Date | null): number {
  if (!date) {
    return date as any;
  }

  return Math.floor(date.getTime() / 1000);
}export function dateUnixTimestampDeserializer(date?: number | null): Date {
  if (!date) {
    return date as any;
  }

  return new Date(date * 1000);
}export function updateMePayloadToTransport(payload: User) {
  return jsonUserToTransportTransform(payload)!;
}export function createRecipePayloadToTransport(payload: CreateRecipe) {
  return jsonCreateRecipeToTransportTransform(payload)!;
}export function updateRecipePayloadToTransport(payload: Recipe) {
  return jsonRecipeToTransportTransform(payload)!;
}export function addCommentPayloadToTransport(
  payload: {
      text: string;
    },
) {
  return {
    text: payload.text
  }!;
}export function refreshPayloadToTransport(
  payload: {
      refreshToken: string;
    },
) {
  return {
    refreshToken: payload.refreshToken
  }!;
}export function jsonUserToTransportTransform(input_?: User | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,role: input_.role,login: input_.login,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,isVerified: input_.isVerified,createdAt: input_.createdAt,updatedAt: input_.updatedAt,photoUrl: input_.photoUrl,subscriptions: jsonArraySubscriptionToTransportTransform(input_.subscriptions),myRecipes: jsonArrayRecipeToTransportTransform(input_.myRecipes),savedRecipes: jsonArraySavedRecipeToTransportTransform(input_.savedRecipes),likedRecipes: jsonArrayGradeRecipeToTransportTransform(input_.likedRecipes),dislikedRecipes: jsonArrayGradeRecipeToTransportTransform(input_.dislikedRecipes)
  }!;
}export function jsonUserToApplicationTransform(input_?: any): User {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,role: input_.role,login: input_.login,firstName: input_.firstName,lastName: input_.lastName,email: input_.email,isVerified: input_.isVerified,createdAt: input_.createdAt,updatedAt: input_.updatedAt,photoUrl: input_.photoUrl,subscriptions: jsonArraySubscriptionToApplicationTransform(input_.subscriptions),myRecipes: jsonArrayRecipeToApplicationTransform(input_.myRecipes),savedRecipes: jsonArraySavedRecipeToApplicationTransform(input_.savedRecipes),likedRecipes: jsonArrayGradeRecipeToApplicationTransform(input_.likedRecipes),dislikedRecipes: jsonArrayGradeRecipeToApplicationTransform(input_.dislikedRecipes)
  }!;
}export function jsonArraySubscriptionToTransportTransform(
  items_?: Array<Subscription> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSubscriptionToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArraySubscriptionToApplicationTransform(
  items_?: any,
): Array<Subscription> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSubscriptionToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonSubscriptionToTransportTransform(
  input_?: Subscription | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,followerId: input_.followerId,authorId: input_.authorId,authorLogin: input_.authorLogin,authorPhotoUrl: input_.authorPhotoUrl,createdAt: input_.createdAt
  }!;
}export function jsonSubscriptionToApplicationTransform(
  input_?: any,
): Subscription {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,followerId: input_.followerId,authorId: input_.authorId,authorLogin: input_.authorLogin,authorPhotoUrl: input_.authorPhotoUrl,createdAt: input_.createdAt
  }!;
}export function jsonArrayRecipeToTransportTransform(
  items_?: Array<Recipe> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRecipeToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRecipeToApplicationTransform(
  items_?: any,
): Array<Recipe> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRecipeToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonRecipeToTransportTransform(input_?: Recipe | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,videoUrl: input_.videoUrl,cookTime: input_.cookTime,isPublished: input_.isPublished,createdAt: input_.createdAt,updatedAt: input_.updatedAt,peopleAmount: input_.peopleAmount,steps: jsonArrayStepToTransportTransform(input_.steps),ingredients: jsonArrayIngredientToTransportTransform(input_.ingredients),comments: jsonArrayCommentToTransportTransform(input_.comments),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonRecipeToApplicationTransform(input_?: any): Recipe {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,videoUrl: input_.videoUrl,cookTime: input_.cookTime,isPublished: input_.isPublished,createdAt: input_.createdAt,updatedAt: input_.updatedAt,peopleAmount: input_.peopleAmount,steps: jsonArrayStepToApplicationTransform(input_.steps),ingredients: jsonArrayIngredientToApplicationTransform(input_.ingredients),comments: jsonArrayCommentToApplicationTransform(input_.comments),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonArrayStepToTransportTransform(
  items_?: Array<Step> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonStepToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayStepToApplicationTransform(
  items_?: any,
): Array<Step> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonStepToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonStepToTransportTransform(input_?: Step | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    recipeId: input_.recipeId,imageUrl: input_.imageUrl,text: input_.text,number: input_.number
  }!;
}export function jsonStepToApplicationTransform(input_?: any): Step {
  if(!input_) {
    return input_ as any;
  }
    return {
    recipeId: input_.recipeId,imageUrl: input_.imageUrl,text: input_.text,number: input_.number
  }!;
}export function jsonArrayIngredientToTransportTransform(
  items_?: Array<Ingredient> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonIngredientToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayIngredientToApplicationTransform(
  items_?: any,
): Array<Ingredient> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonIngredientToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonIngredientToTransportTransform(
  input_?: Ingredient | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,amount: input_.amount,unit: input_.unit
  }!;
}export function jsonIngredientToApplicationTransform(
  input_?: any,
): Ingredient {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,name: input_.name,amount: input_.amount,unit: input_.unit
  }!;
}export function jsonArrayCommentToTransportTransform(
  items_?: Array<Comment> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonCommentToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayCommentToApplicationTransform(
  items_?: any,
): Array<Comment> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonCommentToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonCommentToTransportTransform(input_?: Comment | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    recipeId: input_.recipeId,userId: input_.userId,text: input_.text,createdAt: input_.createdAt
  }!;
}export function jsonCommentToApplicationTransform(input_?: any): Comment {
  if(!input_) {
    return input_ as any;
  }
    return {
    recipeId: input_.recipeId,userId: input_.userId,text: input_.text,createdAt: input_.createdAt
  }!;
}export function jsonArraySavedRecipeToTransportTransform(
  items_?: Array<SavedRecipe> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSavedRecipeToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArraySavedRecipeToApplicationTransform(
  items_?: any,
): Array<SavedRecipe> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonSavedRecipeToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonSavedRecipeToTransportTransform(
  input_?: SavedRecipe | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,userId: input_.userId,recipeId: input_.recipeId,createdAt: input_.createdAt,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,cookTime: input_.cookTime,ingredients: jsonArrayIngredientToTransportTransform(input_.ingredients),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonSavedRecipeToApplicationTransform(
  input_?: any,
): SavedRecipe {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,userId: input_.userId,recipeId: input_.recipeId,createdAt: input_.createdAt,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,cookTime: input_.cookTime,ingredients: jsonArrayIngredientToApplicationTransform(input_.ingredients),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonRecipeCardToTransportTransform(
  input_?: RecipeCard | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    recipeId: input_.recipeId,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,cookTime: input_.cookTime,createdAt: input_.createdAt,ingredients: jsonArrayIngredientToTransportTransform(input_.ingredients),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonRecipeCardToApplicationTransform(
  input_?: any,
): RecipeCard {
  if(!input_) {
    return input_ as any;
  }
    return {
    recipeId: input_.recipeId,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,cookTime: input_.cookTime,createdAt: input_.createdAt,ingredients: jsonArrayIngredientToApplicationTransform(input_.ingredients),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonGradeRecipeToTransportTransform(
  input_?: GradeRecipe | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,userId: input_.userId,recipeId: input_.recipeId,createdAt: input_.createdAt,type: input_.type,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,cookTime: input_.cookTime,ingredients: jsonArrayIngredientToTransportTransform(input_.ingredients),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonGradeRecipeToApplicationTransform(
  input_?: any,
): GradeRecipe {
  if(!input_) {
    return input_ as any;
  }
    return {
    id: input_.id,userId: input_.userId,recipeId: input_.recipeId,createdAt: input_.createdAt,type: input_.type,authorId: input_.authorId,typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,cookTime: input_.cookTime,ingredients: jsonArrayIngredientToApplicationTransform(input_.ingredients),likes: input_.likes,dislikes: input_.dislikes,saves: input_.saves
  }!;
}export function jsonArrayGradeRecipeToTransportTransform(
  items_?: Array<GradeRecipe> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonGradeRecipeToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayGradeRecipeToApplicationTransform(
  items_?: any,
): Array<GradeRecipe> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonGradeRecipeToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonUnauthorizedErrorToTransportTransform(
  input_?: UnauthorizedError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonUnauthorizedErrorToApplicationTransform(
  input_?: any,
): UnauthorizedError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonErrorToTransportTransform(input_?: Error | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonErrorToApplicationTransform(input_?: any): Error {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonConflictErrorToTransportTransform(
  input_?: ConflictError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonConflictErrorToApplicationTransform(
  input_?: any,
): ConflictError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonValidationErrorToTransportTransform(
  input_?: ValidationError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonValidationErrorToApplicationTransform(
  input_?: any,
): ValidationError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonForbiddenErrorToTransportTransform(
  input_?: ForbiddenError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonForbiddenErrorToApplicationTransform(
  input_?: any,
): ForbiddenError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonNotFoundErrorToTransportTransform(
  input_?: NotFoundError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonNotFoundErrorToApplicationTransform(
  input_?: any,
): NotFoundError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonServerErrorToTransportTransform(
  input_?: ServerError | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,exc_type: input_.excType
  }!;
}export function jsonServerErrorToApplicationTransform(
  input_?: any,
): ServerError {
  if(!input_) {
    return input_ as any;
  }
    return {
    code: input_.code,message: input_.message,exception: input_.exception,excType: input_.exc_type
  }!;
}export function jsonPageToTransportTransform(input_?: Page | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayCommentToTransportTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonPageToApplicationTransform(input_?: any): Page {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayCommentToApplicationTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonArrayStringToTransportTransform(
  items_?: Array<string> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayStringToApplicationTransform(
  items_?: any,
): Array<string> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = item as any;
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonPageToTransportTransform_2(input_?: Page_2 | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayRecipeCardToTransportTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonPageToApplicationTransform_2(input_?: any): Page_2 {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayRecipeCardToApplicationTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonArrayRecipeCardToTransportTransform(
  items_?: Array<RecipeCard> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRecipeCardToTransportTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayRecipeCardToApplicationTransform(
  items_?: any,
): Array<RecipeCard> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = jsonRecipeCardToApplicationTransform(item as any);
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonCreateRecipeToTransportTransform(
  input_?: CreateRecipe | null,
): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,videoUrl: input_.videoUrl,cookTime: input_.cookTime,peopleAmount: input_.peopleAmount,steps: jsonArrayStepToTransportTransform(input_.steps),ingredients: jsonArrayIngredientToTransportTransform(input_.ingredients),isPublished: input_.isPublished
  }!;
}export function jsonCreateRecipeToApplicationTransform(
  input_?: any,
): CreateRecipe {
  if(!input_) {
    return input_ as any;
  }
    return {
    typeId: input_.typeId,cuisineId: input_.cuisineId,title: input_.title,desc: input_.desc,imageUrl: input_.imageUrl,videoUrl: input_.videoUrl,cookTime: input_.cookTime,peopleAmount: input_.peopleAmount,steps: jsonArrayStepToApplicationTransform(input_.steps),ingredients: jsonArrayIngredientToApplicationTransform(input_.ingredients),isPublished: input_.isPublished
  }!;
}export function jsonPageToTransportTransform_3(input_?: Page_3 | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayToTransportTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonPageToApplicationTransform_3(input_?: any): Page_3 {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayToApplicationTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonArrayToTransportTransform(
  items_?: Array<{
      id: number;
      followerId: number;
      authorId: number;
      authorLogin: string;
      authorPhotoUrl?: string;
      createdAt: number;
      author: User;
    }> | null,
): any {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = {
      id: item as any.id,followerId: item as any.followerId,authorId: item as any.authorId,authorLogin: item as any.authorLogin,authorPhotoUrl: item as any.authorPhotoUrl,createdAt: item as any.createdAt,author: jsonUserToTransportTransform(item as any.author)
    };
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonArrayToApplicationTransform(items_?: any): Array<{
  id: number;
  followerId: number;
  authorId: number;
  authorLogin: string;
  authorPhotoUrl?: string;
  createdAt: number;
  author: User;
}> {
  if(!items_) {
    return items_ as any;
  }
  const _transformedArray = [];

  for (const item of items_ ?? []) {
    const transformedItem = {
      id: item as any.id,followerId: item as any.followerId,authorId: item as any.authorId,authorLogin: item as any.authorLogin,authorPhotoUrl: item as any.authorPhotoUrl,createdAt: item as any.createdAt,author: jsonUserToApplicationTransform(item as any.author)
    };
    _transformedArray.push(transformedItem);
  }

  return _transformedArray as any;
}export function jsonPageToTransportTransform_4(input_?: Page_4 | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArraySavedRecipeToTransportTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonPageToApplicationTransform_4(input_?: any): Page_4 {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArraySavedRecipeToApplicationTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonPageToTransportTransform_5(input_?: Page_5 | null): any {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayGradeRecipeToTransportTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}export function jsonPageToApplicationTransform_5(input_?: any): Page_5 {
  if(!input_) {
    return input_ as any;
  }
    return {
    items: jsonArrayGradeRecipeToApplicationTransform(input_.items),total: input_.total,page: input_.page,limit: input_.limit
  }!;
}
