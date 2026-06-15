import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Recipe } from "./Recipe";

@Entity("steps")
export class Step {
    @PrimaryGeneratedColumn()
    step_id: number;

    @Column()
    recipe_id: number;

    @Column()
    step_number: number;

    @Column({ type: "text" })
    instruction_text: string;

    @Column({ nullable: true })
    photo_url: string;

    @ManyToOne(() => Recipe, recipe => recipe.steps, { onDelete: "CASCADE" })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;
}