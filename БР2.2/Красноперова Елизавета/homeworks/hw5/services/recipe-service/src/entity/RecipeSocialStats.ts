import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("recipe_social_stats")
export class RecipeSocialStats {
    @PrimaryColumn()
    recipe_id: number;

    @Column({ default: 0 })
    likes_count: number;

    @Column({ default: 0 })
    comments_count: number;

    @Column({ default: 0 })
    saved_count: number;

    @UpdateDateColumn()
    updated_at: Date;
}
