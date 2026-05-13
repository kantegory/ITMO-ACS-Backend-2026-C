import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity("likes")
@Unique(["user_id", "recipe_id"])
export class Like {
    @PrimaryGeneratedColumn()
    like_id: number;

    @Column()
    user_id: number;

    @Column()
    recipe_id: number;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, user => user.likes, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Recipe, recipe => recipe.likes, { onDelete: "CASCADE" })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;
}