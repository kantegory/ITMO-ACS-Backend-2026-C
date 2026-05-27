import bcrypt from 'bcryptjs';
import { AppDataSource } from './data-source';
import {
  Cuisine,
  Menu,
  MenuItem,
  Reservation,
  ReservationStatus,
  Restaurant,
  RestaurantCuisine,
  RestaurantTable,
  Review,
  Role,
  User
} from './entities';

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);
  const restaurantRepo = AppDataSource.getRepository(Restaurant);
  const cuisineRepo = AppDataSource.getRepository(RestaurantCuisine);
  const tableRepo = AppDataSource.getRepository(RestaurantTable);
  const menuRepo = AppDataSource.getRepository(Menu);
  const menuItemRepo = AppDataSource.getRepository(MenuItem);
  const reservationRepo = AppDataSource.getRepository(Reservation);
  const reviewRepo = AppDataSource.getRepository(Review);

  let admin = await userRepo.findOneBy({ phone: '+79990000001' });
  if (!admin) {
    admin = userRepo.create({
      name: 'Admin',
      birthdate: '2000-01-01',
      phone: '+79990000001',
      passwordHash: await bcrypt.hash('admin12345', 10),
      isVerified: true,
      role: Role.Admin
    });
    await userRepo.save(admin);
  }

  let user = await userRepo.findOneBy({ phone: '+79990000002' });
  if (!user) {
    user = userRepo.create({
      name: 'Test User',
      birthdate: '2001-02-03',
      phone: '+79990000002',
      passwordHash: await bcrypt.hash('user12345', 10),
      isVerified: true,
      role: Role.User
    });
    await userRepo.save(user);
  }

  let restaurant = await restaurantRepo.findOneBy({ name: 'Mario Pizza' });
  if (!restaurant) {
    restaurant = restaurantRepo.create({
      name: 'Mario Pizza',
      foundationDate: '2018-04-10',
      phone: '+78121234567',
      address: 'Санкт-Петербург, Невский проспект, 10',
      rating: '4.7',
      avgBill: '1500.00',
      isVerified: true
    });
    await restaurantRepo.save(restaurant);
  }

  for (const cuisine of [Cuisine.European, Cuisine.American, Cuisine.Vegetarian]) {
    const exists = await cuisineRepo.findOneBy({ restaurantId: restaurant.id, cuisine });
    if (!exists) await cuisineRepo.save(cuisineRepo.create({ restaurantId: restaurant.id, cuisine }));
  }

  let table = await tableRepo.findOneBy({ restaurantId: restaurant.id, number: 1 });
  if (!table) {
    table = tableRepo.create({ restaurantId: restaurant.id, number: 1, capacity: 4, isActive: true });
    await tableRepo.save(table);
  }

  let menu = await menuRepo.findOneBy({ restaurantId: restaurant.id, name: 'Основное меню' });
  if (!menu) {
    menu = menuRepo.create({
      restaurantId: restaurant.id,
      name: 'Основное меню',
      description: 'Пицца, паста и салаты',
      isPublished: true
    });
    await menuRepo.save(menu);
  }

  let item = await menuItemRepo.findOneBy({ menuId: menu.id, name: 'Маргарита' });
  if (!item) {
    item = menuItemRepo.create({
      menuId: menu.id,
      name: 'Маргарита',
      price: '590.00',
      description: 'Пицца с томатами, моцареллой и базиликом',
      isPublished: true
    });
    await menuItemRepo.save(item);
  }

  let reservation = await reservationRepo.findOneBy({ userId: user.id, tableId: table.id });
  if (!reservation) {
    reservation = reservationRepo.create({
      userId: user.id,
      restaurantId: restaurant.id,
      tableId: table.id,
      reservedAt: new Date('2026-05-01T18:00:00.000Z'),
      status: ReservationStatus.Completed,
      comment: 'Тестовая завершенная бронь',
      guestCount: 2
    });
    await reservationRepo.save(reservation);
  }

  const review = await reviewRepo.findOneBy({ reservationId: reservation.id });
  if (!review) {
    await reviewRepo.save(reviewRepo.create({
      userId: user.id,
      restaurantId: restaurant.id,
      reservationId: reservation.id,
      date: new Date(),
      rating: '5.0',
      comment: 'Отличный ресторан',
      isVerified: true
    }));
  }

  console.log('Seed completed');
  console.log('Admin credentials: +79990000001 / admin12345');
  console.log('User credentials: +79990000002 / user12345');

  await AppDataSource.destroy();
}

seed().catch(async (error) => {
  console.error(error);
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
