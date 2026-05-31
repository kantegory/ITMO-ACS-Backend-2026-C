import * as amqp from 'amqplib';

let channel: amqp.Channel | null = null;

export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

export const EXCHANGES = {
  USER: 'user.events',
  RECIPE: 'recipe.events',
  ENGAGEMENT: 'engagement.events',
};

export const QUEUES = {
  USER_RECIPE_DELETED: 'user.recipe.deleted',
  RECIPE_USER_DELETED: 'recipe.user.deleted',
  ENGAGEMENT_RECIPE_CREATED: 'engagement.recipe.created',
  ENGAGEMENT_RECIPE_DELETED: 'engagement.recipe.deleted',
  ENGAGEMENT_USER_DELETED: 'engagement.user.deleted',
  RECIPE_COMMENT_UPDATED: 'recipe.comment.updated',
  RECIPE_LIKE_UPDATED: 'recipe.like.updated',
  RECIPE_SAVE_UPDATED: 'recipe.save.updated',
};

export const EVENT_TYPES = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  RECIPE_CREATED: 'recipe.created',
  RECIPE_UPDATED: 'recipe.updated',
  RECIPE_DELETED: 'recipe.deleted',
  RECIPE_PUBLISHED: 'recipe.published',
  RECIPE_LIKED: 'recipe.liked',
  RECIPE_COMMENTED: 'recipe.commented',
  RECIPE_SAVED: 'recipe.saved',
  RECIPE_COMMENT_DELETED: 'recipe.comment.deleted',
  RECIPE_UNLIKED: 'recipe.unliked',
  RECIPE_DISLIKED: 'recipe.disliked',
  RECIPE_UNDISLIKED: 'recipe.undisliked',
  RECIPE_UNSAVED: 'recipe.unsaved',
};

export async function connectRabbitMQ(): Promise<amqp.Channel> {
  if (channel) return channel;
  
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const ch = await connection.createChannel();

    await ch.assertExchange(EXCHANGES.USER, 'topic', { durable: true });
    await ch.assertExchange(EXCHANGES.RECIPE, 'topic', { durable: true });
    await ch.assertExchange(EXCHANGES.ENGAGEMENT, 'topic', { durable: true });
    
    channel = ch;
    console.log('RabbitMQ connected');
    return channel;
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    throw error;
  }
}

export async function publishEvent(exchange: string, routingKey: string, data: any) {
  const ch = await connectRabbitMQ();
  ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
  console.log(`Event published: ${exchange} / ${routingKey}`, data);
}

export async function consumeEvents(
  exchange: string,
  queueName: string,
  routingKeys: string[],
  callback: (data: any, routingKey: string) => Promise<void>
) {
  const ch = await connectRabbitMQ();
  
  await ch.assertQueue(queueName, { durable: true });

  for (const key of routingKeys) {
    await ch.bindQueue(queueName, exchange, key);
  }

  ch.consume(queueName, async (msg) => {
    if (msg) {
      try {
        const data = JSON.parse(msg.content.toString());
        await callback(data, msg.fields.routingKey);
        ch.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        ch.nack(msg, false, true);
      }
    }
  });
  
  console.log(`Consuming on queue: ${queueName}`, routingKeys);
}