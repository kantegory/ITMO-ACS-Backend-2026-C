import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId!: string;

  @Column({ name: 'reservation_id', type: 'uuid', unique: true })
  reservationId!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ type: 'numeric', precision: 2, scale: 1 })
  rating!: string;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @OneToMany(() => PhotoReview, (photo) => photo.review)
  photos!: PhotoReview[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('photos_review')
export class PhotoReview {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId!: string;

  @ManyToOne(() => Review, (review) => review.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review!: Review;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export const reviewEntities = [Review, PhotoReview];
