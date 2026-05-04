import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  Index,
} from 'typeorm';

@Entity("messages_users")
@Index(['user_id'], { unique: true })
export class MessageUser extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;          

  @Column({ type: 'varchar', length: 150 })
  user_name!: string;   
}
