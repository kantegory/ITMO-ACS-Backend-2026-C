import bcrypt from 'bcrypt';

// Копия лр1/src/utils/hash-password.ts.
const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

export default hashPassword;
