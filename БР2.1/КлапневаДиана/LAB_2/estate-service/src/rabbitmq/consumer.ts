// @ts-nocheck
import { getChannel } from './connection';

type EventHandler = (payload: any) => Promise<void>;

export class EventConsumer {
  private static instance: EventConsumer;
  private exchangeName = 'real_estate_exchange';
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  static getInstance(): EventConsumer {
    if (!EventConsumer.instance) {
      EventConsumer.instance = new EventConsumer();
    }
    return EventConsumer.instance;
  }

  registerHandler(eventType: string, handler: EventHandler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    console.log(`Handler registered for: ${eventType}`);
  }

  async startConsuming(serviceName: string) {
    try {
      const channel = getChannel();
      const exchange = this.exchangeName;

      await channel.assertExchange(exchange, 'topic', { durable: true });

      const queueName = `${serviceName}_queue`;
      const q = await channel.assertQueue(queueName, { 
        durable: true, 
        exclusive: false 
      });

      console.log(`Queue created: ${q.queue}`);

      // Подписываемся на все события
      const routingKeys = ['user.*', 'estate.*', 'deal.*', 'message.*'];
      
      for (const key of routingKeys) {
        await channel.bindQueue(q.queue, exchange, key);
      }

      // Используем any для обхода проблем с типами
      channel.consume(q.queue, async (msg: any) => {
        if (msg) {
          try {
            const payload = JSON.parse(msg.content.toString());
            console.log(`Received event: ${payload.eventType}`, payload);

            const handlers = this.handlers.get(payload.eventType) || [];
            for (const handler of handlers) {
              await handler(payload);
            }

            channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            channel.nack(msg, false, false);
          }
        }
      });

      console.log(`Consumer started for ${serviceName}`);
    } catch (error) {
      console.error('Failed to start consumer:', error);
    }
  }
}
