import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";

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

    @ManyToOne(() => Comment, { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "parent_comment_id" })
    parentComment: Comment;
}
