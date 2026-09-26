// Роль пользователя — данные из payload JWT. Владелец сущности User и этого enum — auth-service
// (раздел 4 CLAUDE.md), но само значение роли нужно и другим сервисам, поэтому enum копируется
// в каждый сервис так же, как остальной общий код (раздел 7 CLAUDE.md).
enum Role {
    ADMIN = 'ADMIN',
    RESTAURANT_ADMIN = 'RESTAURANT_ADMIN',
    USER = 'USER',
}

export { Role };
