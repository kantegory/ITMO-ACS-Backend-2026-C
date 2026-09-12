import { User } from '../models/user.entity';
import { Recipe } from '../models/recipe.entity';
import { Comment } from '../models/comment.entity';

// Убираем из ответа чувствительные поля пользователя (passwordHash, токен подтверждения email)
export function serializeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar ?? undefined,
    role: user.role,
  };
}

interface RecipeSerializeOptions {
  isLiked?: boolean;
  isFavorite?: boolean;
}

export function serializeRecipe(recipe: Recipe, options: RecipeSerializeOptions = {}) {
  return {
    id: recipe.id,
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    fullDescription: recipe.fullDescription,
    difficulty: recipe.difficulty,
    cookingTime: recipe.cookingTime,
    author: serializeUser(recipe.author),
    category: { id: recipe.category.id, title: recipe.category.title },
    tags: (recipe.tags || []).map((tag) => ({ id: tag.id, title: tag.title })),
    ingredients: (recipe.ingredients || [])
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit ?? undefined,
      })),
    steps: (recipe.steps || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((step) => ({ order: step.order, description: step.description })),
    image: recipe.image ?? undefined,
    status: recipe.status,
    likesCount: recipe.likesCount ?? 0,
    isLiked: options.isLiked,
    isFavorite: options.isFavorite,
  };
}

export function serializeComment(comment: Comment) {
  return {
    id: comment.id,
    text: comment.text,
    user: serializeUser(comment.user),
  };
}
