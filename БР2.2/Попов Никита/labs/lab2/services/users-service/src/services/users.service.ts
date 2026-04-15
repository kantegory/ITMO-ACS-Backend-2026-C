import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UsersRepository } from "../repositories/users.repository";
import { config } from "../config";
import { UserRole } from "../entities/user.entity";
import { LoginDto, RegisterDto, UpdateProfileDto } from "../dto/users.dto";

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly publish: (topic: string, payload: object) => Promise<void>
  ) {}

  private tokens(user: { id: string; role: string }) {
    return {
      accessToken: jwt.sign({ user }, config.jwtSecret, { expiresIn: "5m" }),
      refreshToken: jwt.sign({ user, type: "refresh" }, config.jwtSecret, { expiresIn: "1h" })
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) return { error: [409, { code: "EMAIL_EXISTS", message: "Пользователь уже существует" }] as const };
    const user = await this.usersRepository.save({
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.CLIENT
    });
    await this.publish("users.user.registered", {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    return { data: this.tokens({ id: user.id, role: user.role }) };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) return { error: [404, { code: "NOT_FOUND", message: "Пользователь не найден" }] as const };
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) return { error: [401, { code: "INVALID_CREDENTIALS", message: "Неверный логин или пароль" }] as const };
    return { data: this.tokens({ id: user.id, role: user.role }) };
  }

  async me(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) return { error: [404, { code: "NOT_FOUND", message: "Пользователь не найден" }] as const };
    const { password: _password, ...safe } = user;
    return { data: safe };
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.updateProfile(userId, dto.firstName, dto.lastName);
    if (!user) return { error: [404, { code: "NOT_FOUND", message: "Пользователь не найден" }] as const };
    await this.publish("users.user.profile_updated", {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName
    });
    const { password: _password, ...safe } = user;
    return { data: safe };
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await this.usersRepository.updateRole(userId, role);
    if (!user) return { error: [404, { code: "NOT_FOUND", message: "Пользователь не найден" }] as const };
    await this.publish("users.user.role_changed", { userId, role });
    const { password: _password, ...safe } = user;
    return { data: safe };
  }

  async internalGet(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) return { error: [404, { code: "NOT_FOUND", message: "Пользователь не найден" }] as const };
    const { password: _password, createdAt: _createdAt, ...internalView } = user;
    return { data: internalView };
  }
}
