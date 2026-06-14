-- Заполнение БД тестовыми данными (5-10 строк на таблицу)
-- Пароль для всех пользователей: password123
--
-- Запуск:
--   psql -h localhost -p 15432 -U maindb -d maindb -f seed.sql
--
-- (пароль maindb запросит psql, либо: PGPASSWORD=maindb psql ... -f seed.sql)

-- Очистка (порядок важен из-за FK)
TRUNCATE TABLE review, booking, menu_item, restaurant, "user" RESTART IDENTITY CASCADE;

-- ========== USER (10 пользователей) ==========
INSERT INTO "user" (id, email, password, "firstName", "lastName", role) VALUES
  (gen_random_uuid(), 'admin@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Админ', 'Админов', 'ADMIN'::user_role_enum),
  (gen_random_uuid(), 'owner1@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Петр', 'Рестораторов', 'OWNER'::user_role_enum),
  (gen_random_uuid(), 'owner2@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Анна', 'Владелицева', 'OWNER'::user_role_enum),
  (gen_random_uuid(), 'client1@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Иван', 'Иванов', 'CLIENT'::user_role_enum),
  (gen_random_uuid(), 'client2@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Мария', 'Петрова', 'CLIENT'::user_role_enum),
  (gen_random_uuid(), 'client3@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Алексей', 'Сидоров', 'CLIENT'::user_role_enum),
  (gen_random_uuid(), 'client4@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Елена', 'Козлова', 'CLIENT'::user_role_enum),
  (gen_random_uuid(), 'client5@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Дмитрий', 'Новиков', 'CLIENT'::user_role_enum),
  (gen_random_uuid(), 'client6@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Ольга', 'Морозова', 'CLIENT'::user_role_enum),
  (gen_random_uuid(), 'client7@test.com', '$2b$08$hJa0qbNtiWFNCMf6iIJ5ieA.4MTcW17tD1CCrw2Jn7I/wxFkOivsW', 'Сергей', 'Волков', 'CLIENT'::user_role_enum);

-- ========== RESTAURANT (8 ресторанов) ==========
INSERT INTO restaurant (id, name, description, address, city, "priceLevel", capacity, rating) VALUES
  (gen_random_uuid(), 'Итальянская кухня', 'Паста, пицца, тирамису', 'ул. Итальянская, 1', 'Санкт-Петербург', 'MEDIUM'::restaurant_pricelevel_enum, 40, 4.5),
  (gen_random_uuid(), 'Суши-бар', 'Японская кухня, роллы', 'Невский пр., 10', 'Санкт-Петербург', 'MEDIUM_HIGH'::restaurant_pricelevel_enum, 25, 4.8),
  (gen_random_uuid(), 'Быстрое питание', 'Бургеры, картофель фри', 'пр. Победы, 5', 'Москва', 'LOW'::restaurant_pricelevel_enum, 80, 3.9),
  (gen_random_uuid(), 'Стейк-хаус', 'Стейки, гриль', 'ул. Мясная, 15', 'Москва', 'HIGH'::restaurant_pricelevel_enum, 30, 4.7),
  (gen_random_uuid(), 'Кавказская кухня', 'Шашлык, хинкали', 'пр. Кавказский, 7', 'Санкт-Петербург', 'MEDIUM'::restaurant_pricelevel_enum, 50, 4.6),
  (gen_random_uuid(), 'Кофейня', 'Кофе, десерты', 'ул. Кофейная, 3', 'Москва', 'LOW'::restaurant_pricelevel_enum, 20, 4.3),
  (gen_random_uuid(), 'Рыбный ресторан', 'Рыба, морепродукты', 'наб. Рыбная, 12', 'Санкт-Петербург', 'HIGH'::restaurant_pricelevel_enum, 35, 4.9),
  (gen_random_uuid(), 'Пекарня', 'Хлеб, выпечка, завтраки', 'ул. Хлебная, 9', 'Москва', 'LOW'::restaurant_pricelevel_enum, 45, 4.2);

-- ========== MENU_ITEM (по 2-3 блюда на ресторан, итого ~20) ==========
-- Категории: main, dessert, drinks
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Паста Карбонара', 'Спагетти, бекон, яйцо', 450 FROM restaurant r WHERE r.name = 'Итальянская кухня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Пицца Маргарита', NULL, 380 FROM restaurant r WHERE r.name = 'Итальянская кухня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '22222222-2222-2222-2222-222222222222'::uuid, 'Тирамису', NULL, 320 FROM restaurant r WHERE r.name = 'Итальянская кухня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Филадельфия ролл', NULL, 420 FROM restaurant r WHERE r.name = 'Суши-бар' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Дракон ролл', NULL, 480 FROM restaurant r WHERE r.name = 'Суши-бар' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '33333333-3333-3333-3333-333333333333'::uuid, 'Зелёный чай', NULL, 100 FROM restaurant r WHERE r.name = 'Суши-бар' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Бургер классический', NULL, 250 FROM restaurant r WHERE r.name = 'Быстрое питание' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Картофель фри', NULL, 120 FROM restaurant r WHERE r.name = 'Быстрое питание' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '33333333-3333-3333-3333-333333333333'::uuid, 'Кола', NULL, 80 FROM restaurant r WHERE r.name = 'Быстрое питание' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Рибай стейк 300г', NULL, 1200 FROM restaurant r WHERE r.name = 'Стейк-хаус' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Томагавк 500г', NULL, 2500 FROM restaurant r WHERE r.name = 'Стейк-хаус' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Шашлык из баранины', NULL, 450 FROM restaurant r WHERE r.name = 'Кавказская кухня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Хинкали (5 шт)', NULL, 280 FROM restaurant r WHERE r.name = 'Кавказская кухня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '33333333-3333-3333-3333-333333333333'::uuid, 'Капучино', NULL, 150 FROM restaurant r WHERE r.name = 'Кофейня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '22222222-2222-2222-2222-222222222222'::uuid, 'Чизкейк', NULL, 220 FROM restaurant r WHERE r.name = 'Кофейня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Стейк из тунца', NULL, 890 FROM restaurant r WHERE r.name = 'Рыбный ресторан' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Устрицы (6 шт)', NULL, 650 FROM restaurant r WHERE r.name = 'Рыбный ресторан' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Круассан', NULL, 120 FROM restaurant r WHERE r.name = 'Пекарня' LIMIT 1;
INSERT INTO menu_item ("restaurantId", "categoryId", name, description, price)
SELECT r.id, '33333333-3333-3333-3333-333333333333'::uuid, 'Свежевыжатый сок', NULL, 180 FROM restaurant r WHERE r.name = 'Пекарня' LIMIT 1;

-- ========== BOOKING (8 бронирований) ==========
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status, comment)
SELECT u.id, r.id, NOW() + INTERVAL '1 day' + TIME '19:00', NOW() + INTERVAL '1 day' + TIME '21:00', 2, 'CONFIRMED'::booking_status_enum, 'Столик у окна'
FROM "user" u, restaurant r WHERE u.email = 'client1@test.com' AND r.name = 'Итальянская кухня' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status)
SELECT u.id, r.id, NOW() + INTERVAL '2 days' + TIME '18:30', NOW() + INTERVAL '2 days' + TIME '20:30', 4, 'CONFIRMED'::booking_status_enum
FROM "user" u, restaurant r WHERE u.email = 'client2@test.com' AND r.name = 'Суши-бар' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status)
SELECT u.id, r.id, NOW() + INTERVAL '3 days' + TIME '20:00', NOW() + INTERVAL '3 days' + TIME '22:00', 2, 'CONFIRMED'::booking_status_enum
FROM "user" u, restaurant r WHERE u.email = 'client3@test.com' AND r.name = 'Стейк-хаус' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status, comment)
SELECT u.id, r.id, NOW() + INTERVAL '1 day' + TIME '12:00', NOW() + INTERVAL '1 day' + TIME '14:00', 1, 'CONFIRMED'::booking_status_enum, 'Бранч'
FROM "user" u, restaurant r WHERE u.email = 'client4@test.com' AND r.name = 'Кофейня' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status)
SELECT u.id, r.id, NOW() - INTERVAL '1 day' + TIME '19:00', NOW() - INTERVAL '1 day' + TIME '21:00', 6, 'CONFIRMED'::booking_status_enum
FROM "user" u, restaurant r WHERE u.email = 'client5@test.com' AND r.name = 'Кавказская кухня' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status)
SELECT u.id, r.id, NOW() + INTERVAL '5 days' + TIME '19:30', NOW() + INTERVAL '5 days' + TIME '21:30', 3, 'CANCELLED'::booking_status_enum
FROM "user" u, restaurant r WHERE u.email = 'client6@test.com' AND r.name = 'Рыбный ресторан' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status)
SELECT u.id, r.id, NOW() + INTERVAL '1 day' + TIME '09:00', NOW() + INTERVAL '1 day' + TIME '10:00', 2, 'CONFIRMED'::booking_status_enum
FROM "user" u, restaurant r WHERE u.email = 'client7@test.com' AND r.name = 'Пекарня' LIMIT 1;
INSERT INTO booking ("userId", "restaurantId", "fromDate", "toDate", "guestCount", status)
SELECT u.id, r.id, NOW() + INTERVAL '4 days' + TIME '18:00', NOW() + INTERVAL '4 days' + TIME '19:30', 2, 'CONFIRMED'::booking_status_enum
FROM "user" u, restaurant r WHERE u.email = 'client1@test.com' AND r.name = 'Суши-бар' LIMIT 1;

-- ========== REVIEW (10 отзывов) ==========
INSERT INTO review ("userId", "restaurantId", rating, comment)
SELECT u.id, r.id, 5, 'Отличная паста!' FROM "user" u, restaurant r WHERE u.email = 'client1@test.com' AND r.name = 'Итальянская кухня' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating, comment)
SELECT u.id, r.id, 4, 'Хорошие роллы' FROM "user" u, restaurant r WHERE u.email = 'client2@test.com' AND r.name = 'Суши-бар' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating)
SELECT u.id, r.id, 3 FROM "user" u, restaurant r WHERE u.email = 'client3@test.com' AND r.name = 'Быстрое питание' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating, comment)
SELECT u.id, r.id, 5, 'Лучший стейк в городе' FROM "user" u, restaurant r WHERE u.email = 'client4@test.com' AND r.name = 'Стейк-хаус' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating)
SELECT u.id, r.id, 4 FROM "user" u, restaurant r WHERE u.email = 'client5@test.com' AND r.name = 'Кавказская кухня' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating, comment)
SELECT u.id, r.id, 5, 'Уютно и вкусно' FROM "user" u, restaurant r WHERE u.email = 'client6@test.com' AND r.name = 'Кофейня' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating)
SELECT u.id, r.id, 5 FROM "user" u, restaurant r WHERE u.email = 'client7@test.com' AND r.name = 'Рыбный ресторан' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating)
SELECT u.id, r.id, 4 FROM "user" u, restaurant r WHERE u.email = 'client1@test.com' AND r.name = 'Пекарня' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating, comment)
SELECT u.id, r.id, 4, 'Доставка быстрая' FROM "user" u, restaurant r WHERE u.email = 'client2@test.com' AND r.name = 'Быстрое питание' LIMIT 1;
INSERT INTO review ("userId", "restaurantId", rating)
SELECT u.id, r.id, 4 FROM "user" u, restaurant r WHERE u.email = 'client3@test.com' AND r.name = 'Стейк-хаус' LIMIT 1;
