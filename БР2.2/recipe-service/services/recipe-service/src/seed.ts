import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { Category } from './models/category.entity';
import { Tag } from './models/tag.entity';
import { Unit } from './models/unit.entity';

async function seed() {
  await AppDataSource.initialize();
  console.log('[recipe-service] База подключена, заполняю справочники...');

  const categoryRepo = AppDataSource.getRepository(Category);
  const tagRepo = AppDataSource.getRepository(Tag);
  const unitRepo = AppDataSource.getRepository(Unit);

  const categories = ['Завтраки', 'Супы', 'Основные блюда', 'Десерты', 'Напитки'];
  for (const title of categories) {
    const exists = await categoryRepo.findOne({ where: { title } });
    if (!exists) await categoryRepo.save(categoryRepo.create({ title }));
  }

  const tags = ['Быстро', 'Вегетарианское', 'Острое', 'Праздничное', 'Полезное'];
  for (const title of tags) {
    const exists = await tagRepo.findOne({ where: { title } });
    if (!exists) await tagRepo.save(tagRepo.create({ title }));
  }

  const units = ['г', 'кг', 'мл', 'л', 'шт', 'ст. л.', 'ч. л.'];
  for (const name of units) {
    const exists = await unitRepo.findOne({ where: { name } });
    if (!exists) await unitRepo.save(unitRepo.create({ name }));
  }

  const allCategories = await categoryRepo.find();
  const allTags = await tagRepo.find();
  console.log('[recipe-service] Заполнение завершено');
  console.log('Категории:', allCategories.map((c) => `${c.id}=${c.title}`).join(', '));
  console.log('Теги:      ', allTags.map((t) => `${t.id}=${t.title}`).join(', '));

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('[recipe-service] Ошибка заполнения БД:', err);
  process.exit(1);
});
