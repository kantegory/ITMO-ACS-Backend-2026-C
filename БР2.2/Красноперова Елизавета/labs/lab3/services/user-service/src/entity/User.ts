import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
@Entity("users")
export class User {
  @PrimaryGeneratedColumn() user_id: number;
  @Column({unique:true,length:50}) username: string;
  @Column({unique:true}) email: string;
  @Column() password_hash: string;
  @Column({nullable:true}) avatar_url: string;
  @Column({type:"text",nullable:true}) bio: string;
  @Column({default:"user"}) role: string;
  @CreateDateColumn() created_at: Date;
}
