import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    BaseEntity,
    CreateDateColumn,
    ManyToOne,
} from 'typeorm';
import { Property } from './property.entity';

@Entity()
export class PropertyPhoto extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 500, nullable: false })
    url: string;

    @Column({ type: 'integer', default: 0 })
    sortOrder: number;

    @Column({ type: 'boolean', default: false })
    isMain: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Property, (property) => property.photos, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    property: Property;

    @Column({ type: 'integer' })
    propertyId: number;
}
