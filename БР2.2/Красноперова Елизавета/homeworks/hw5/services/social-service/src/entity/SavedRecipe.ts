import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from "typeorm";

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
}
