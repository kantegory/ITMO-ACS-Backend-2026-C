import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { RecipeIngredient } from "./RecipeIngredient";

@Entity("ingredients")
export class Ingredient {
    @PrimaryGeneratedColumn()
    ingredient_id: number;

    @Column({ unique: true, length: 100 })
    name: string;

    @Column({ length: 50, nullable: true })
    category: string;

    @OneToMany(() => RecipeIngredient, ri => ri.ingredient)
    recipeIngredients: RecipeIngredient[];
}