import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Cuisine } from './Cuisine';
import { TypeRecipe } from './TypeRecipe';
import { Step } from './Step';
import { Ingredient } from './Ingredient';
import { Comment } from './Comment';
import { Like } from './Like';
import { Dislike } from './Dislike';
import { SavedRecipe } from './SavedRecipe';

@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'author_id' })
  authorId: number;

  @Column({ name: 'type_id' })
  typeId: number;

  @Column({ name: 'cuisine_id' })
  cuisineId: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  desc: string;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'video_url', nullable: true, length: 500 })
  videoUrl: string;

  @Column({ name: 'cook_time' })
  cookTime: number;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @Column({ name: 'people_amount', type: 'smallint', default: 2 })
  peopleAmount: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  @Column({ default: 0 })
  saves: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.recipes)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Cuisine)
  @JoinColumn({ name: 'cuisine_id' })
  cuisine: Cuisine;

  @ManyToOne(() => TypeRecipe)
  @JoinColumn({ name: 'type_id' })
  type: TypeRecipe;

  @OneToMany(() => Step, step => step.recipe, { cascade: true })
  steps: Step[];

  @OneToMany(() => Ingredient, ingredient => ingredient.recipe, { cascade: true })
  ingredients: Ingredient[];

  @OneToMany(() => Comment, comment => comment.recipe)
  comments: Comment[];

  @OneToMany(() => Like, like => like.recipe)
  likesList: Like[];

  @OneToMany(() => Dislike, dislike => dislike.recipe)
  dislikesList: Dislike[];

  @OneToMany(() => SavedRecipe, saved => saved.recipe)
  savedByUsers: SavedRecipe[];
}