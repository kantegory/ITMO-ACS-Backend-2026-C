import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity("saved_recipes")
@Unique(["user_id", "recipe_id"])
export class SavedRecipe {
    @PrimaryGeneratedColumn()
    saved_id: number;

    @Column()
    user_id: number;

    @Column()
    recipe_id: number;

    @CreateDateColumn()
    saved_at: Date;

    @ManyToOne(() => User, user => user.savedRecipes, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Recipe, recipe => recipe.savedBy, { onDelete: "CASCADE" })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;
}