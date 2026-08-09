import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../models/User.entity';
import { CreateUserDto, UpdateUserDto, UserResponse } from '../dto/user.dto';
import * as bcrypt from 'bcrypt';

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    async findAll(): Promise<UserResponse[]> {
        const users = await this.userRepository.find();
        return users.map(this.toResponse);
    }

    async findById(id: number): Promise<UserResponse | null> {
        const user = await this.userRepository.findOneBy({ id });
        return user ? this.toResponse(user) : null;
    }

    async create(data: CreateUserDto): Promise<UserResponse> {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = this.userRepository.create({
            ...data,
            password: hashedPassword
        });
        const saved = await this.userRepository.save(user);
        return this.toResponse(saved);
    }

    async update(id: number, data: UpdateUserDto): Promise<UserResponse | null> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) return null;

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        Object.assign(user, data);
        const updated = await this.userRepository.save(user);
        return this.toResponse(updated);
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.userRepository.delete(id);
        // Исправлено: проверка на null
        return result.affected !== undefined && result.affected !== null && result.affected > 0;
    }

    private toResponse(user: User): UserResponse {
        const { password, ...response } = user;
        return response as UserResponse;
    }
}
