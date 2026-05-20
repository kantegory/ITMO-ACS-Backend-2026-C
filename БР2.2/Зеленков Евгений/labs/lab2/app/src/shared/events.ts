import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

export type DomainEvent = {
  eventId: string;
  eventVersion: number;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}

export class ConsoleEventPublisher implements EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log(JSON.stringify({ event: event.eventType, eventId: event.eventId, payload: event.payload }));
  }
}

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_id', unique: true })
  eventId!: string;

  @Column({ name: 'event_version' })
  eventVersion!: number;

  @Column({ name: 'event_type' })
  eventType!: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt!: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
