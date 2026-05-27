import amqp from 'amqplib';
import { config } from '../../shared/config';
import { DomainEvent } from '../../shared/events';
import { CatalogDataSource } from './data-source';
import { ProcessedMessage, Restaurant, RestaurantRatingAggregate } from './entities';

const reviewVerifiedQueue = 'restaurant-catalog.review-verified.v2';
const reviewVerifiedDlq = 'restaurant-catalog.review-verified.v2.dlq';
const deadLetterExchange = `${config.rabbitmq.exchange}.dlx`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertDomainEvent(value: unknown): DomainEvent {
  if (
    !isRecord(value) ||
    typeof value.eventId !== 'string' ||
    typeof value.eventVersion !== 'number' ||
    typeof value.eventType !== 'string' ||
    typeof value.occurredAt !== 'string' ||
    !isRecord(value.payload)
  ) {
    throw new Error('Invalid domain event');
  }

  return {
    eventId: value.eventId,
    eventVersion: value.eventVersion,
    eventType: value.eventType,
    occurredAt: value.occurredAt,
    payload: value.payload
  };
}

function assertReviewVerifiedPayload(payload: Record<string, unknown>) {
  if (
    typeof payload.reviewId !== 'string' ||
    typeof payload.restaurantId !== 'string' ||
    typeof payload.reservationId !== 'string' ||
    typeof payload.rating !== 'number' ||
    !Number.isFinite(payload.rating) ||
    payload.rating < 1 ||
    payload.rating > 5
  ) {
    throw new Error('Invalid review.verified payload');
  }

  return {
    reviewId: payload.reviewId,
    restaurantId: payload.restaurantId,
    reservationId: payload.reservationId,
    rating: payload.rating
  };
}

async function handleReviewVerified(event: DomainEvent) {
  const payload = assertReviewVerifiedPayload(event.payload);

  await CatalogDataSource.transaction(async (manager) => {
    const processedRepo = manager.getRepository(ProcessedMessage);
    const businessKey = `review:${payload.reviewId}`;
    const alreadyProcessed = await processedRepo.findOne({
      where: [{ eventId: event.eventId }, { businessKey }]
    });
    if (alreadyProcessed) return;

    const restaurantRepo = manager.getRepository(Restaurant);
    const restaurant = await restaurantRepo.findOneBy({ id: payload.restaurantId });
    if (!restaurant) return;

    const aggregateRepo = manager.getRepository(RestaurantRatingAggregate);
    let aggregate = await aggregateRepo.findOneBy({ restaurantId: payload.restaurantId });

    if (!aggregate) {
      aggregate = aggregateRepo.create({
        restaurantId: payload.restaurantId,
        ratingSum: String(payload.rating),
        ratingCount: 1
      });
    } else {
      aggregate.ratingSum = String(Number(aggregate.ratingSum) + payload.rating);
      aggregate.ratingCount += 1;
    }

    await aggregateRepo.save(aggregate);
    restaurant.rating = (Number(aggregate.ratingSum) / aggregate.ratingCount).toFixed(1);
    await restaurantRepo.save(restaurant);
    await processedRepo.save(processedRepo.create({
      eventId: event.eventId,
      eventType: event.eventType,
      businessKey
    }));
  });
}

export async function startCatalogRabbitConsumer() {
  const connection = await amqp.connect(config.rabbitmq.url);
  connection.on('error', (error) => {
    console.error('RabbitMQ consumer connection error', error);
  });
  connection.on('close', () => {
    console.error('RabbitMQ consumer connection closed');
  });

  const channel = await connection.createChannel();
  channel.on('error', (error) => {
    console.error('RabbitMQ consumer channel error', error);
  });
  channel.on('close', () => {
    console.error('RabbitMQ consumer channel closed');
  });

  await channel.assertExchange(config.rabbitmq.exchange, 'topic', { durable: true });
  await channel.assertExchange(deadLetterExchange, 'topic', { durable: true });
  await channel.assertQueue(reviewVerifiedDlq, { durable: true });
  await channel.bindQueue(reviewVerifiedDlq, deadLetterExchange, 'review.verified');
  await channel.assertQueue(reviewVerifiedQueue, {
    durable: true,
    deadLetterExchange,
    deadLetterRoutingKey: 'review.verified'
  });
  await channel.bindQueue(reviewVerifiedQueue, config.rabbitmq.exchange, 'review.verified');
  await channel.prefetch(1);

  await channel.consume(reviewVerifiedQueue, async (message) => {
    if (!message) return;

    try {
      const event = assertDomainEvent(JSON.parse(message.content.toString()));
      if (event.eventType !== 'review.verified') {
        console.warn(`Skipping unexpected event type: ${event.eventType}`);
        channel.ack(message);
        return;
      }
      await handleReviewVerified(event);
      channel.ack(message);
    } catch (error) {
      console.error(error);
      channel.nack(message, false, false);
    }
  });

  console.log(`restaurant-catalog-service consuming RabbitMQ queue ${reviewVerifiedQueue}`);
}
