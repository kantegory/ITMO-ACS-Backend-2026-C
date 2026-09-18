import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { Comment } from './comment.entity';

// Роль пользователя. Храним как обычную строку (а не typeorm enum),
// чтобы не зависеть от особенностей конкретной СУБД — проверяем значение вручную в сервисах.
export type UserRole = 'user' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  // Храним только хэш пароля, сам пароль нигде не сохраняем (bcrypt)
  @Column()
  passwordHash!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string | null;

  @Column({ type: 'varchar', default: 'user' })
  role!: UserRole;

  @Column({ default: false })
  isEmailVerified!: boolean;

  // Токен для подтверждения почты. После подтверждения — очищается.
  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Recipe, (recipe) => recipe.author)
  recipes!: Recipe[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];
}
