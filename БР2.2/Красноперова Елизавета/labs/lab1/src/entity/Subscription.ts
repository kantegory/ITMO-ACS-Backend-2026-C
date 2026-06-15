import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";

@Entity("subscriptions")
@Unique(["follower_id", "followed_id"])
export class Subscription {
    @PrimaryGeneratedColumn()
    sub_id: number;

    @Column()
    follower_id: number;

    @Column()
    followed_id: number;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => User, user => user.subscriptions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "follower_id" })
    follower: User;

    @ManyToOne(() => User, user => user.subscribers, { onDelete: "CASCADE" })
    @JoinColumn({ name: "followed_id" })
    followed: User;
}