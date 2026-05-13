import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Recipe } from "./Recipe";
import { Ingredient } from "./Ingredient";

@Entity("recipe_ingredients")
export class RecipeIngredient {
    @PrimaryGeneratedColumn()
    recipe_ingredient_id: number;

    @Column()
    recipe_id: number;

    @Column()
    ingredient_id: number;

    @Column({ length: 50 })
    quantity: string;

    @ManyToOne(() => Recipe, recipe => recipe.recipeIngredients, { onDelete: "CASCADE" })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;

    @ManyToOne(() => Ingredient, ingredient => ingredient.recipeIngredients, { onDelete: "CASCADE" })
    @JoinColumn({ name: "ingredient_id" })
    ingredient: Ingredient;
}