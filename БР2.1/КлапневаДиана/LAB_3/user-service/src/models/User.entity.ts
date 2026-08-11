import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';

export enum DealRole {
  LANDLORD = 'landlord',
  TENANT = 'tenant'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'first_name' })
  first_name!: string;

  @Column({ name: 'middle_name', nullable: true })
  middle_name?: string;

  @Column({ name: 'last_name' })
  last_name!: string;

  @Column({ 
    type: 'enum', 
    enum: DealRole, 
    nullable: true 
  })
  deal_role?: DealRole;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ name: 'is_verified', default: false })
  is_verified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at?: Date;
}