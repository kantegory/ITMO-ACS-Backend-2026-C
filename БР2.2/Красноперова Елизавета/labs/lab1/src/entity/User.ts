import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Recipe } from "./Recipe";
import { Comment } from "./Comment";
import { Like } from "./Like";
import { SavedRecipe } from "./SavedRecipe";
import { Subscription } from "./Subscription";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    user_id: number;

    @Column({ unique: true, length: 50 })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;

    @Column({ nullable: true })
    avatar_url: string;

    @Column({ type: "text", nullable: true })
    bio: string;

    @Column({ default: "user" })
    role: string;

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Recipe, recipe => recipe.author)
    recipes: Recipe[];

    @OneToMany(() => Comment, comment => comment.user)
    comments: Comment[];

    @OneToMany(() => Like, like => like.user)
    likes: Like[];

    @OneToMany(() => SavedRecipe, saved => saved.user)
    savedRecipes: SavedRecipe[];

    @OneToMany(() => Subscription, sub => sub.follower)
    subscriptions: Subscription[];

    @OneToMany(() => Subscription, sub => sub.followed)
    subscribers: Subscription[];
}