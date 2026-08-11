import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne
} from 'typeorm';
import { Session } from './Session.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ name: 'session_id' })
  session_id: number;

  @Column()
  message: string;

  @Column({ name: 'attachment_file_path', nullable: true })
  attachment_file_path?: string;

  @Column({ name: 'is_reshared', default: false })
  is_reshared?: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at?: Date;

  @ManyToOne(() => Session, session => session.messages)
  session: Session;
}
