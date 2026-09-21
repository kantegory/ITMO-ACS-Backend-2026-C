// Роли пользователей. USER — обычный гость, RESTAURANT_ADMIN — управляет
// одним или несколькими ресторанами, ADMIN — управляет всей системой.
// Используется и как тип колонки role в таблице user, и в проверках доступа
// (см. roles.middleware.ts, restaurant-admin.middleware.ts).
enum Role {
    ADMIN = 'ADMIN',
    RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
    USER = 'USER',
}

export { Role };
