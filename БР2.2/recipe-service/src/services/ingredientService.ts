import { AppDataSource } from '../config/data-source';
import { Ingredient } from '../models/ingredient.entity';

const ingredientRepo = () => AppDataSource.getRepository(Ingredient);

export async function searchIngredients(search?: string) {
  const qb = ingredientRepo().createQueryBuilder('ingredient');
  if (search) {
    qb.where('ingredient.name LIKE :search', { search: `%${search}%` });
  }
  const rows = await qb.orderBy('ingredient.name', 'ASC').limit(100).getMany();
  return rows.map((i) => ({
    name: i.name,
    quantity: i.quantity,
    unit: i.unit ?? undefined,
  }));
}
