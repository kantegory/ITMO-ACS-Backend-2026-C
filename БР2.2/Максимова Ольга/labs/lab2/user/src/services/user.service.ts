import { Repository } from "typeorm";
import jwt from "jsonwebtoken";
import {
  AuthRequestDto,
  AuthResponseDto,
  CreateUserDto,
  UserResponseDto,
  UserValDTO,
  UpdateProfileDto,
} from "../dto";
import { User } from "../models/user.entity";
import dataSource from "../config/data-source";
import { Role } from "../models/role.enum";
import settings from "../config/config";
import { Topics, publish, checkPassword } from "common";

class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = dataSource.getRepository(User);
  }

  async register(payload: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findOne({
      where: { email: payload.email },
    });
    if (existing) {
      throw new Error("User with this email already exists");
    }

    const user = this.userRepository.create({
      first_name: payload.first_name,
      last_name: payload.last_name,
      middle_name: payload.middle_name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      is_verified: false,
    });

    const savedUser = await this.userRepository.save(user);
    await publish(Topics.User, {
      eventType: "user.registered",
      id: savedUser.id,  
      first_name: savedUser.first_name,
      email: savedUser.email,
      timestamp: Date.now(),
    });
    return this.toUserResponse(savedUser);
  }

  async authenticate(payload: AuthRequestDto): Promise<AuthResponseDto | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: payload.email })
      .getOne();

    if (!user) return null;

    const isPasswordValid = await checkPassword(
      payload.password,
      user.password,
    );
    if (!isPasswordValid) return null;

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      settings.JWT_SECRET_KEY!,
      { expiresIn: "1d" },
    );

    await publish(Topics.User, {
      eventType: "user.loggedin",
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
    });

    return {
      token,
      user: this.toUserResponse(user),
    };
  }

  async getById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.toUserResponse(user) : null;
  }

  async batch(ids: string[]): Promise<UserResponseDto[]> {
    if (!ids.length) return [];
    const users = await this.userRepository
      .createQueryBuilder("u")
      .where("u.id IN (:...ids)", { ids })
      .getMany();

    return users.map((user) => this.toUserResponse(user));
  }

  async batchInternal(ids: string[]): Promise<UserValDTO[]> {
    if (!ids.length) return [];

    const users = await this.userRepository
      .createQueryBuilder("u")
      .where("u.id IN (:...ids)", { ids })
      .getMany();

    const result = users.map((user) => ({
      id: user.id,
      is_verified: user.is_verified,
    }));

    return result;
  }

  async validateActive(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    return !!(user && user.is_verified);
  }

  async getByRole(id: string, role: Role): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ where: { id, role } });
    return user ? this.toUserResponse(user) : null;
  }

  async updateRole(id: string, role: Role) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    user.role = role;
    return this.userRepository.save(user);
  }

  async verifyUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: id } });
    if (!user) return false;

    if (user.is_verified) return true;

    user.is_verified = true;
    await this.userRepository.save(user);

    await publish(Topics.User, {
      eventType: "user.verified",
      userId: user.id,
      isVerified: true,
      role: user.role,
      timestamp: Date.now(),
    });

    return true;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (dto.first_name !== undefined) {
      user.first_name = dto.first_name;
    }

    if (dto.middle_name !== undefined) {
      user.middle_name = dto.middle_name;
    }

    if (dto.last_name !== undefined) {
      user.last_name = dto.last_name;
    }

    if (dto.password !== undefined) {
      user.password = dto.password; 
    }

    if (dto.email !== undefined) {
      const exists = await this.userRepository.findOneBy({ email: dto.email });
      if (exists && exists.id !== userId) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }
      user.email = dto.email;
    }

    await this.userRepository.save(user);
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      middle_name: user.middle_name,
      email: user.email,
      role: user.role,
    };
  }
}

export default new UserService();
