import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Step } from "./Step";
import { RecipeIngredient } from "./RecipeIngredient";
@Entity("recipes")
export class Recipe {
  @PrimaryGeneratedColumn() recipe_id: number;
  @Column({length:200}) title: string;
  @Column({type:"text",nullable:true}) description: string;
  @Column({nullable:true}) photo_main_url: string;
  @Column({nullable:true}) video_url: string;
  @Column() cooking_time_min: number;
  @Column({type:"enum",enum:["easy","medium","hard"],default:"medium"}) difficulty: "easy"|"medium"|"hard";
  @Column() dish_type: string;
  @Column({default:true}) is_published: boolean;
  @CreateDateColumn() published_at: Date;
  @Column() author_id: number;
  @OneToMany(()=>Step,step=>step.recipe,{cascade:true}) steps: Step[];
  @OneToMany(()=>RecipeIngredient,ri=>ri.recipe,{cascade:true}) recipeIngredients: RecipeIngredient[];
}
