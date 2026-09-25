import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Recipe } from "./Recipe";

@Entity("comments")
export class Comment {
    @PrimaryGeneratedColumn()
    comment_id: number;

    @Column({ type: "text" })
    content: string;

    @Column()
    user_id: number;

    @Column()
    recipe_id: number;

    @Column({ nullable: true })
    parent_comment_id: number;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, user => user.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Recipe, recipe => recipe.comments, { onDelete: "CASCADE" })
    @JoinColumn({ name: "recipe_id" })
    recipe: Recipe;

    @ManyToOne(() => Comment, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "parent_comment_id" })
    parentComment: Comment;
}