import { AppDataSource } from "../config/data-source";
import { ConflictError, NotFoundError } from "../errors/http-errors";
import { User, UserRole } from "../models/User";

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export class UsersService {
  private userRepository = AppDataSource.getRepository(User);

  async list(filters: {
    page: number;
    pageSize: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    const { page, pageSize, search, role, isActive, isVerified } = filters;

    const qb = this.userRepository.createQueryBuilder("user");

    if (search) {
      qb.andWhere(
        "LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(COALESCE(user.middleName, '')) LIKE :search",
        { search: `%${search.toLowerCase()}%` }
      );
    }

    if (role) {
      qb.andWhere("user.role = :role", { role });
    }

    if (isActive !== undefined) {
      qb.andWhere("user.isActive = :isActive", { isActive });
    }

    if (isVerified !== undefined) {
      qb.andWhere("user.isVerified = :isVerified", { isVerified });
    }

    qb.orderBy("user.id", "ASC");
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async getById(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }

    return user;
  }

  async getMe(userId: number) {
    return this.getById(userId);
  }

  async update(userId: number, data: UpdateUserInput) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new ConflictError("Пользователь с таким email уже существует");
      }
    }

    this.userRepository.merge(user, data);
    return this.userRepository.save(user);
  }

  async delete(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }

    await this.userRepository.remove(user);
  }
}

export const usersService = new UsersService();
