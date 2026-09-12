import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Роль храним обычной строкой (не typeorm enum) — проверяем значение вручную в сервисах,
// чтобы не зависеть от особенностей конкретной СУБД.
export type UserRole = 'user' | 'admin';

// В отличие от монолита, здесь у User больше НЕТ полей recipes/comments —
// Recipe и Comment теперь живут в других сервисах, в других базах данных,
// и TypeORM-связь между базами физически невозможна (это и есть суть database-per-service).
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

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

  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken?: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
