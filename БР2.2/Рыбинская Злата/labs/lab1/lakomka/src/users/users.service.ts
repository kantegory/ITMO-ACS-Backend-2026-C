import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users: any[] = [];

  create(createUserDto: any) {
    const existingUser = this.users.find(u => u.email === createUserDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = {
      id: this.users.length + 1,
      ...createUserDto,
      createdAt: new Date()
    };

    const { password, ...result } = user;
    this.users.push(user);
    return result;
  }

  async login(email: string, password: string) {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return {
      user: result,
      message: 'Login successful'
    };
  }

  findAll() {
    return this.users.map(({ password, ...user }) => user);
  }

  findOne(id: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const { password, ...result } = user;
    return result;
  }

  update(id: number, updateUserDto: any) {
    const index = this.users.findIndex(u => u.id === id);
    
    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.email) {
      const existingUser = this.users.find(
        u => u.email === updateUserDto.email && u.id !== id
      );
      
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    this.users[index] = {
      ...this.users[index],
      ...updateUserDto,
      updatedAt: new Date()
    };

    const { password, ...result } = this.users[index];
    return result;
  }

  remove(id: number) {
    const index = this.users.findIndex(u => u.id === id);

    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const removed = this.users.splice(index, 1);
    const { password, ...user } = removed[0];

    return { message: 'User removed', user };
  }

  findByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }
}