import { Recipe } from '../models/recipe.entity';
import { PublicUser } from '../clients/authClient';

interface RecipeSerializeOptions {
  author: PublicUser; // обязателен — получен заранее через authClient
  likesCount: number; // обязателен — получен заранее через socialClient
  isLiked?: boolean;
  isFavorite?: boolean;
}

export function serializeRecipe(recipe: Recipe, options: RecipeSerializeOptions) {
  return {
    id: recipe.id,
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    fullDescription: recipe.fullDescription,
    difficulty: recipe.difficulty,
    cookingTime: recipe.cookingTime,
    author: options.author,
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
    likesCount: options.likesCount,
    isLiked: options.isLiked,
    isFavorite: options.isFavorite,
  };
}

// Облегчённая версия для internal-эндпоинта (Social Service не нуждается
// в ingredients/steps при проверке "рецепт существует?" или сборке избранного)
export function serializeInternalRecipe(recipe: Recipe, author: PublicUser, likesCount: number) {
  return {
    id: recipe.id,
    title: recipe.title,
    shortDescription: recipe.shortDescription,
    difficulty: recipe.difficulty,
    cookingTime: recipe.cookingTime,
    image: recipe.image ?? undefined,
    status: recipe.status,
    authorId: recipe.authorId,
    author,
    likesCount,
  };
}
