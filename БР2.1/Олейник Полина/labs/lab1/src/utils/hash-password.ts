import bcrypt from 'bcrypt';

// Превращает пароль в хэш bcrypt — из хэша нельзя восстановить исходный пароль,
// но можно проверить, совпадает ли введённый пароль с этим хэшем (см. check-password.ts).
// Именно хэш, а не сам пароль, хранится в базе (см. user.entity.ts, user.subscriber.ts).
const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8)); // genSaltSync(8) — "сложность" хэширования: чем больше число, тем дольше и надёжнее
};

export default hashPassword;
