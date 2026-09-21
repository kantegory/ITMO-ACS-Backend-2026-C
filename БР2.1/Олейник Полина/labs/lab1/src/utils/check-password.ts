import bcrypt from 'bcrypt';

// Сравнивает пароль, который ввёл пользователь, с хэшем, который хранится в базе.
// bcrypt сам умеет это делать без расшифровки хэша — compareSync хэширует
// переданный пароль тем же алгоритмом и сравнивает результаты.
const checkPassword = (userPassword: string, password: string) => {
    return bcrypt.compareSync(password, userPassword);
};

export default checkPassword;
