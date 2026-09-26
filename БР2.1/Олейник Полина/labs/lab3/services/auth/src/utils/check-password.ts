import bcrypt from 'bcrypt';

// Копия лр1/src/utils/check-password.ts.
const checkPassword = (userPassword: string, password: string) => {
    return bcrypt.compareSync(password, userPassword);
};

export default checkPassword;
