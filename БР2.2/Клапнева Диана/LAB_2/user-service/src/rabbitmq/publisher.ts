import { getChannel } from './connection';

export class EventPublisher {
    private static instance: EventPublisher;
    private exchangeName = 'real_estate_exchange';

    private constructor() { }

    static getInstance(): EventPublisher {
        if (!EventPublisher.instance) {
            EventPublisher.instance = new EventPublisher();
        }
        return EventPublisher.instance;
    }

    async publishEvent(eventType: string, data: any, source: string) {
        try {
            const channel = getChannel();
            const exchange = this.exchangeName;

            await channel.assertExchange(exchange, 'topic', { durable: true });

            const payload = {
                eventType,
                data,
                timestamp: new Date().toISOString(),
                source,
            };

            const message = Buffer.from(JSON.stringify(payload));

            channel.publish(exchange, eventType, message, {
                persistent: true,
                contentType: 'application/json',
            });

            console.log(`Event published: ${eventType}`, { source, data });
        } catch (error) {
            console.error('Failed to publish event:', error);
        }
    }
}
