import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import amqp, { ChannelModel, ConfirmChannel } from 'amqplib';
import { config } from './config';

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

export class RabbitMqEventPublisher implements EventPublisher {
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) return this.channel;

    this.connection = await amqp.connect(config.rabbitmq.url);
    this.connection.on('error', (error) => {
      console.error('RabbitMQ connection error', error);
    });
    this.connection.on('close', () => {
      this.connection = undefined;
      this.channel = undefined;
    });

    this.channel = await this.connection.createConfirmChannel();
    this.channel.on('error', (error) => {
      console.error('RabbitMQ channel error', error);
    });
    this.channel.on('close', () => {
      this.channel = undefined;
    });

    await this.channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });
    return this.channel;
  }

  async publish(event: DomainEvent): Promise<void> {
    const channel = await this.getChannel();
    channel.publish(
      config.rabbitmq.exchange,
      event.eventType,
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        contentType: 'application/json',
        messageId: event.eventId,
        timestamp: Date.now()
      }
    );
    await channel.waitForConfirms();
  }

  async close(): Promise<void> {
    const channel = this.channel;
    const connection = this.connection;
    this.channel = undefined;
    this.connection = undefined;

    if (channel) await channel.close();
    if (connection) await connection.close();
  }
}

// Reserved as the persistence table for a future transactional outbox worker.
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
