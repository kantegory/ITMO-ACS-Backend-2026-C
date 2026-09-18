import 'reflect-metadata';
import { AppDataSource } from './config/data-source';
import { User } from './models/user.entity';
import { hashPassword } from './utils/password';

async function seed() {
  await AppDataSource.initialize();
  console.log('[auth-service] База подключена, заполняю...');

  const userRepo = AppDataSource.getRepository(User);

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
    console.log('Создан администратор: admin@recipes.local / admin12345');
  } else {
    console.log('Администратор уже существует, пропускаю');
  }

  await AppDataSource.destroy();
  console.log('[auth-service] Готово');
}

seed().catch((err) => {
  console.error('[auth-service] Ошибка заполнения БД:', err);
  process.exit(1);
});
