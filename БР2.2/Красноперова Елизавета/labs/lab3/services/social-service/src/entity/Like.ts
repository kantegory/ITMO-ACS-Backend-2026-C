import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from "typeorm";

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
}
