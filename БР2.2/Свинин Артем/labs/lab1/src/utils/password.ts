import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// Хэшировать пароль перед сохранением в базу данных.
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Сравнить пароль в открытом виде с сохраненным хэшем.
export const comparePassword = async (
  password: string,
  passwordHash: string
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};
