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

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'restaurant_id', type: 'uuid' })
  restaurantId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_published', default: false })
  isPublished!: boolean;

  @OneToMany(() => MenuItem, (item) => item.menu)
  items!: MenuItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'menu_id', type: 'uuid' })
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

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('photos_menu_item')
export class PhotoMenuItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'menu_item_id', type: 'uuid' })
  menuItemId!: string;

  @ManyToOne(() => MenuItem, (item) => item.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_item_id' })
  menuItem!: MenuItem;

  @Column({ name: 'file_path', type: 'text' })
  filePath!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export const menuEntities = [Menu, MenuItem, PhotoMenuItem];
