import 'reflect-metadata'; // нужно для декораторов TypeORM — этот файл запускается отдельно от app.ts, поэтому импорт повторяется

import dataSource from '../config/data-source';

import { City } from '../models/city.entity';
import { Cuisine } from '../models/cuisine.entity';
import { User } from '../models/user.entity';
import { Restaurant } from '../models/restaurant.entity';
import { RestaurantAdmin } from '../models/restaurant-admin.entity';
import { RestaurantTable } from '../models/restaurant-table.entity';
import { TimeSlot } from '../models/time-slot.entity';
import { MenuItem } from '../models/menu-item.entity';
import { Role } from '../models/enums/role.enum';
import { MenuCategory } from '../models/enums/menu-category.enum';

// Скрипт для заполнения пустой базы тестовыми данными — запускается вручную
// командой `npm run seed` (не при обычном запуске сервера). Работает напрямую
// с репозиториями TypeORM, минуя HTTP и контроллеры — как если бы кто-то
// вручную выполнил все эти запросы через Postman по очереди.
async function seed(): Promise<void> {
    await dataSource.initialize(); // открываем своё собственное соединение с базой (сервер при этом не запускается)

    const cityRepository = dataSource.getRepository(City);
    const cuisineRepository = dataSource.getRepository(Cuisine);
    const userRepository = dataSource.getRepository(User);
    const restaurantRepository = dataSource.getRepository(Restaurant);
    const restaurantAdminRepository =
        dataSource.getRepository(RestaurantAdmin);
    const tableRepository = dataSource.getRepository(RestaurantTable);
    const timeSlotRepository = dataSource.getRepository(TimeSlot);
    const menuItemRepository = dataSource.getRepository(MenuItem);

    // города и кухни — справочники, нужны как внешние ключи для ресторана ниже
    const spb = await cityRepository.save(
        cityRepository.create({ name: 'Санкт-Петербург' }),
    );
    await cityRepository.save(cityRepository.create({ name: 'Москва' }));

    const italian = await cuisineRepository.save(
        cuisineRepository.create({ name: 'Итальянская' }),
    );
    await cuisineRepository.save(
        cuisineRepository.create({ name: 'Японская' }),
    );

    // три пользователя с разными ролями — чтобы сразу можно было проверить все уровни доступа.
    // Пароль передаём обычным текстом — он захэшируется автоматически подписчиком
    // UserSubscriber (см. models/user.subscriber.ts), здесь про это думать не нужно.
    await userRepository.save(
        userRepository.create({
            email: 'admin@example.com',
            password: 'admin12345',
            first_name: 'Админ',
            last_name: 'Системы',
            role: Role.ADMIN,
        }),
    );

    const restaurantOwner = await userRepository.save(
        userRepository.create({
            email: 'owner@example.com',
            password: 'owner12345',
            first_name: 'Иван',
            last_name: 'Ресторанов',
            role: Role.RESTAURANT_ADMIN,
        }),
    );

    await userRepository.save(
        userRepository.create({
            email: 'guest@example.com',
            password: 'guest12345',
            first_name: 'Анна',
            last_name: 'Гостева',
            role: Role.USER,
        }),
    );

    // один полностью заполненный ресторан — с городом/кухней, столиками, слотами и меню
    const restaurant = await restaurantRepository.save(
        restaurantRepository.create({
            name: 'Траттория Порто',
            description: 'Уютный ресторан итальянской кухни',
            city_id: spb.id,
            cuisine_id: italian.id,
            district: 'Центральный',
            address: 'Невский проспект, 10',
            average_check: 1800,
            opening_time: '10:00',
            closing_time: '23:00',
        }),
    );

    // назначаем owner@example.com администратором этого ресторана
    await restaurantAdminRepository.save(
        restaurantAdminRepository.create({
            user_id: restaurantOwner.id,
            restaurant_id: restaurant.id,
        }),
    );

    await tableRepository.save([
        tableRepository.create({
            restaurant_id: restaurant.id,
            number: 'A1',
            capacity: 4,
            zone: 'Зал',
        }),
        tableRepository.create({
            restaurant_id: restaurant.id,
            number: 'A2',
            capacity: 2,
            zone: 'Терраса',
        }),
    ]);

    await timeSlotRepository.save([
        timeSlotRepository.create({
            restaurant_id: restaurant.id,
            start_time: '12:00',
            end_time: '14:00',
        }),
        timeSlotRepository.create({
            restaurant_id: restaurant.id,
            start_time: '18:00',
            end_time: '20:00',
        }),
    ]);

    await menuItemRepository.save([
        menuItemRepository.create({
            restaurant_id: restaurant.id,
            category: MenuCategory.MAIN_COURSE,
            name: 'Паста карбонара',
            description: 'Спагетти, бекон, желток, пекорино',
            price: 690,
        }),
        menuItemRepository.create({
            restaurant_id: restaurant.id,
            category: MenuCategory.DESSERT,
            name: 'Тирамису',
            price: 420,
        }),
    ]);

    console.log('Тестовые данные созданы.');
    await dataSource.destroy(); // закрываем соединение — скрипт разовый, а не постоянно работающий сервер
}

seed().catch((error) => {
    console.error('Не удалось создать тестовые данные:', error);
    process.exit(1);
});
