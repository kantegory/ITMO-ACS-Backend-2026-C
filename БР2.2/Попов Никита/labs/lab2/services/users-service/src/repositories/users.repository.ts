import { Repository } from "typeorm";
import { UserEntity, UserRole } from "../entities/user.entity";

export class UsersRepository {
  constructor(private readonly repository: Repository<UserEntity>) {}

  findByEmail(email: string) {
    return this.repository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.repository.findOne({ where: { id } });
  }

  save(user: Partial<UserEntity>) {
    return this.repository.save(this.repository.create(user));
  }

  async updateProfile(id: string, firstName?: string, lastName?: string) {
    const user = await this.findById(id);
    if (!user) return null;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    return this.repository.save(user);
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.findById(id);
    if (!user) return null;
    user.role = role;
    return this.repository.save(user);
  }
}