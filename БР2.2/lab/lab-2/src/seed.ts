import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { Category } from './models/category.entity';
import { Tag } from './models/tag.entity';
import { Unit } from './models/unit.entity';
import { User } from './models/user.entity';
import { hashPassword } from './utils/password';

// В спецификации API (main.tsp) нет отдельных эндпоинтов для создания категорий/тегов/единиц —
// они выступают справочниками, поэтому наполняем их один раз этим скриптом (npm run seed).
async function seed() {
  await AppDataSource.initialize();
  console.log('База данных подключена, заполняю справочники...');

  const categoryRepo = AppDataSource.getRepository(Category);
  const tagRepo = AppDataSource.getRepository(Tag);
  const unitRepo = AppDataSource.getRepository(Unit);
  const userRepo = AppDataSource.getRepository(User);

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

  const adminEmail = 'admin@recipes.local';
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await hashPassword('admin12345');
    await userRepo.save(
      userRepo.create({
        username: 'admin',
        email: adminEmail,
        passwordHash,
        firstName: 'Админ',
        lastName: 'Админов',
        role: 'admin',
        isEmailVerified: true,
      })
    );
    console.log('👤 Создан администратор: admin@recipes.local / admin12345');
  }

  const allCategories = await categoryRepo.find();
  const allTags = await tagRepo.find();
  const allUnits = await unitRepo.find();

  console.log('Заполнение завершено');
  console.log('Категории:', allCategories.map((c) => `${c.id}=${c.title}`).join(', '));
  console.log('Теги:      ', allTags.map((t) => `${t.id}=${t.title}`).join(', '));
  console.log('Единицы:   ', allUnits.map((u) => `${u.id}=${u.name}`).join(', '));

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Ошибка заполнения БД:', err);
  process.exit(1);
});
