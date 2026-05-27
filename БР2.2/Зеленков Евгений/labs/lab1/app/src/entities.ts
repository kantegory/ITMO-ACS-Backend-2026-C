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

export enum Role {
  Admin = 'Admin',
  User = 'User'
}

export enum ReservationStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Cancelled = 'Cancelled',
  Completed = 'Completed'
}

export enum Cuisine {
  European = 'European',
  Asian = 'Asian',
  Eastern = 'Eastern',
  Caucasian = 'Caucasian',
  American = 'American',
  Vegetarian = 'Vegetarian'
}

abstract class TimestampedEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('users')
export class User extends TimestampedEntity {
  @Column()
  name!: string;

  @Column({ type: 'date' })
  birthdate!: string;

  @Column({ unique: true })
  phone!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.User })
  role!: Role;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];
}

@Entity('restaurants')
export class Restaurant extends TimestampedEntity {
  @Column()
  name!: string;

  @Column({ name: 'foundation_date', type: 'date', nullable: true })
  foundationDate!: string | null;

  @Column()
  phone!: string;

  @Column()
  address!: string;

  @Column({ type: 'numeric', precision: 2, scale: 1, default: 0 })
  rating!: string;

  @Column({ name: 'avg_bill', type: 'numeric', precision: 10, scale: 2 })
  avgBill!: string;

  @Column({ name: 'is_verified', default: false })
  isVerified!: boolean;

  @OneToMany(() => RestaurantCuisine, (restaurantCuisine) => restaurantCuisine.restaurant)
  cuisines!: RestaurantCuisine[];

  @OneToMany(() => RestaurantTable, (table) => table.restaurant)
  tables!: RestaurantTable[];

  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus!: Menu[];
}

@Entity('restaurant_cuisines')
export class RestaurantCuisine extends TimestampedEntity {
  @Column({ name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.cuisines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({ type: 'enum', enum: Cuisine })
  cuisine!: Cuisine;
}

@Entity('restaurant_tables')
export class RestaurantTable extends TimestampedEntity {
  @Column({ name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column()
  number!: number;

  @Column()
  capacity!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}

@Entity('menus')
export class Menu extends TimestampedEntity {
  @Column({ name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @OneToMany(() => MenuItem, (menuItem) => menuItem.menu)
  items!: MenuItem[];
}

@Entity('menu_items')
export class MenuItem extends TimestampedEntity {
  @Column({ name: 'menu_id' })
  menuId!: string;

  @ManyToOne(() => Menu, (menu) => menu.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu!: Menu;

  @Column()
  name!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @OneToMany(() => PhotoMenuItem, (photo) => photo.menuItem)
  photos!: PhotoMenuItem[];
}

@Entity('reservations')
export class Reservation extends TimestampedEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.reservations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({ name: 'table_id' })
  tableId!: string;

  @ManyToOne(() => RestaurantTable, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table!: RestaurantTable;

  @Column({ name: 'reserved_at', type: 'timestamp' })
  reservedAt!: Date;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.Pending })
  status!: ReservationStatus;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @Column({ name: 'guest_count' })
  guestCount!: number;
}

@Entity('reviews')
export class Review extends TimestampedEntity {
  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'restaurant_id' })
  restaurantId!: string;

  @ManyToOne(() => Restaurant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  @Column({ name: 'reservation_id' })
  reservationId!: string;

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation;

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
}

@Entity('photos_review')
export class PhotoReview extends TimestampedEntity {
  @Column({ name: 'review_id' })
  reviewId!: string;

  @ManyToOne(() => Review, (review) => review.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review!: Review;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;
}

@Entity('photos_menu_item')
export class PhotoMenuItem extends TimestampedEntity {
  @Column({ name: 'menu_item_id' })
  menuItemId!: string;

  @ManyToOne(() => MenuItem, (menuItem) => menuItem.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;
}

export const entities = [
  User,
  Restaurant,
  RestaurantCuisine,
  RestaurantTable,
  Menu,
  MenuItem,
  Reservation,
  Review,
  PhotoReview,
  PhotoMenuItem
];
