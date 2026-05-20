import bcrypt from 'bcryptjs';
import { Cuisine, ReservationStatus, Role } from './shared/enums';
import { IdentityDataSource } from './services/identity/data-source';
import { User } from './services/identity/entities';
import { CatalogDataSource } from './services/catalog/data-source';
import { Restaurant, RestaurantCuisine, RestaurantTable } from './services/catalog/entities';
import { MenuDataSource } from './services/menu/data-source';
import { Menu, MenuItem } from './services/menu/entities';
import { ReservationDataSource } from './services/reservation/data-source';
import { Reservation } from './services/reservation/entities';
import { ReviewDataSource } from './services/review/data-source';

async function seedIdentity() {
  const repo = IdentityDataSource.getRepository(User);
  const users = [
    { name: 'Admin', birthdate: '1990-01-01', phone: '+79990000001', password: 'admin12345', role: Role.Admin, isVerified: true },
    { name: 'User', birthdate: '1995-01-01', phone: '+79990000002', password: 'user12345', role: Role.User, isVerified: true }
  ];

  for (const item of users) {
    const existing = await repo.findOneBy({ phone: item.phone });
    if (existing) continue;
    await repo.save(repo.create({
      name: item.name,
      birthdate: item.birthdate,
      phone: item.phone,
      passwordHash: await bcrypt.hash(item.password, 10),
      role: item.role,
      isVerified: item.isVerified
    }));
  }
}

async function seedCatalog() {
  const restaurantRepo = CatalogDataSource.getRepository(Restaurant);
  let restaurant = await restaurantRepo.findOneBy({ phone: '+78120000001' });
  if (!restaurant) {
    restaurant = await restaurantRepo.save(restaurantRepo.create({
      name: 'North Table',
      foundationDate: '2020-01-01',
      phone: '+78120000001',
      address: 'Saint Petersburg, Nevsky prospect, 1',
      rating: '4.6',
      avgBill: '1800.00',
      isVerified: true
    }));
  }

  const cuisineRepo = CatalogDataSource.getRepository(RestaurantCuisine);
  if (!(await cuisineRepo.findOneBy({ restaurantId: restaurant.id, cuisine: Cuisine.European }))) {
    await cuisineRepo.save(cuisineRepo.create({ restaurantId: restaurant.id, cuisine: Cuisine.European }));
  }

  const tableRepo = CatalogDataSource.getRepository(RestaurantTable);
  if (!(await tableRepo.findOneBy({ restaurantId: restaurant.id, number: 1 }))) {
    await tableRepo.save(tableRepo.create({ restaurantId: restaurant.id, number: 1, capacity: 4, isActive: true }));
  }

  return restaurant;
}

async function seedMenu(restaurantId: string) {
  const menuRepo = MenuDataSource.getRepository(Menu);
  let menu = await menuRepo.findOneBy({ restaurantId, name: 'Main menu' });
  if (!menu) {
    menu = await menuRepo.save(menuRepo.create({
      restaurantId,
      name: 'Main menu',
      description: 'Published restaurant menu',
      isPublished: true
    }));
  }

  const itemRepo = MenuDataSource.getRepository(MenuItem);
  if (!(await itemRepo.findOneBy({ menuId: menu.id, name: 'Pasta' }))) {
    await itemRepo.save(itemRepo.create({
      menuId: menu.id,
      name: 'Pasta',
      price: '650.00',
      description: 'Pasta with tomato sauce',
      isPublished: true
    }));
  }
}

async function seedReservation(restaurantId: string) {
  const user = await IdentityDataSource.getRepository(User).findOneBy({ phone: '+79990000002' });
  const table = await CatalogDataSource.getRepository(RestaurantTable).findOneBy({ restaurantId, number: 1 });
  if (!user || !table) return;

  const repo = ReservationDataSource.getRepository(Reservation);
  if (await repo.findOneBy({ userId: user.id, tableId: table.id })) return;

  const reservedAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const reservedUntil = new Date(reservedAt.getTime() + 2 * 60 * 60 * 1000);
  await repo.save(repo.create({
    userId: user.id,
    restaurantId,
    tableId: table.id,
    reservedAt,
    reservedUntil,
    status: ReservationStatus.Pending,
    guestCount: 2,
    comment: 'Seed reservation'
  }));
}

async function main() {
  try {
    // Initialize every service database so TypeORM synchronize creates all lab schemas.
    await IdentityDataSource.initialize();
    await CatalogDataSource.initialize();
    await MenuDataSource.initialize();
    await ReservationDataSource.initialize();
    await ReviewDataSource.initialize();

    await seedIdentity();
    const restaurant = await seedCatalog();
    await seedMenu(restaurant.id);
    await seedReservation(restaurant.id);

    console.log('Seed completed');
  } finally {
    if (ReviewDataSource.isInitialized) await ReviewDataSource.destroy();
    if (ReservationDataSource.isInitialized) await ReservationDataSource.destroy();
    if (MenuDataSource.isInitialized) await MenuDataSource.destroy();
    if (CatalogDataSource.isInitialized) await CatalogDataSource.destroy();
    if (IdentityDataSource.isInitialized) await IdentityDataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
