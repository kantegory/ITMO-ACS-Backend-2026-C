import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import bcrypt from 'bcryptjs';
import { Recipe } from './Recipe';
import { Comment } from './Comment';
import { Like } from './Like';
import { Dislike } from './Dislike';
import { SavedRecipe } from './SavedRecipe';
import { Subscription } from './Subscription';

export enum UserRole {
  ADMIN = 'ADMIN',
  AUTHOR = 'AUTHOR'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  login: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'first_name', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', length: 50 })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.AUTHOR })
  role: UserRole;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'photo_url', nullable: true, length: 500 })
  photoUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Recipe, recipe => recipe.author)
  recipes: Recipe[];

  @OneToMany(() => Comment, comment => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, like => like.user)
  likes: Like[];

  @OneToMany(() => Dislike, dislike => dislike.user)
  dislikes: Dislike[];

  @OneToMany(() => SavedRecipe, saved => saved.user)
  savedRecipes: SavedRecipe[];

  @OneToMany(() => Subscription, subscription => subscription.follower)
  subscriptions: Subscription[];

  @OneToMany(() => Subscription, subscription => subscription.author)
  subscribers: Subscription[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

