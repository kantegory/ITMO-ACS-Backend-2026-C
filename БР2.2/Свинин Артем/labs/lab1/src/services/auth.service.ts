import { createHash } from "crypto";
import { IsNull, QueryFailedError } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../errors/http-errors";
import { RefreshToken } from "../models/RefreshToken";
import { User, UserRole } from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

interface RegisterUserInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
}

interface LoginUserInput {
  email: string;
  password: string;
}

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private getRefreshExpiresAt() {
    const days = 30;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async issueTokens(user: User) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.getRefreshExpiresAt(),
        revokedAt: null,
      })
    );

    return { accessToken, refreshToken };
  }

  async register(data: RegisterUserInput) {
    const { firstName, lastName, middleName, email, password } = data;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError("Пользователь с таким email уже существует");
    }

    const passwordHash = await hashPassword(password);

    const user = this.userRepository.create({
      firstName,
      lastName,
      middleName,
      email,
      passwordHash,
      role: UserRole.USER,
      isVerified: false,
      isActive: true,
    });

    let savedUser: User;
    try {
      savedUser = await this.userRepository.save(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        typeof (error as { code?: string }).code === "string" &&
        (error as { code?: string }).code === "23505"
      ) {
        throw new ConflictError("Пользователь с таким email уже существует");
      }
      throw error;
    }

    return this.issueTokens(savedUser);
  }

  async login(data: LoginUserInput) {
    const { email, password } = data;

    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();
    if (!user) {
      throw new UnauthorizedError("Неверный email или пароль");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Пользователь деактивирован");
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Неверный email или пароль");
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: { id: number };

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Недействительный или просроченный refresh token");
    }

    const user = await this.userRepository.findOne({ where: { id: payload.id } });
    if (!user) {
      throw new NotFoundError("Пользователь не найден");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Пользователь деактивирован");
    }

    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        revokedAt: IsNull(),
      },
    });

    if (!tokenEntity || tokenEntity.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError("Недействительный или просроченный refresh token");
    }

    tokenEntity.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenEntity);

    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: {
        tokenHash: this.hashToken(refreshToken),
        revokedAt: IsNull(),
      },
    });

    if (!tokenEntity) {
      return;
    }

    tokenEntity.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenEntity);
  }
}

export const authService = new AuthService();
