import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from "typeorm";

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
}
