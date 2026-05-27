import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { adminRequired, authRequired, serviceTokenRequired } from '../../shared/auth';
import { config } from '../../shared/config';
import { listDto } from '../../shared/dto';
import { Role } from '../../shared/enums';
import { DomainEvent, OutboxEvent, RabbitMqEventPublisher } from '../../shared/events';
import { HttpError } from '../../shared/errors';
import { serviceRequest } from '../../shared/http-client';
import { optionalString, pagination, requiredBoolean, requiredNumber, requiredString } from '../../shared/validation';
import { ReviewDataSource } from './data-source';
import { PhotoReview, Review } from './entities';
import { photoReviewDto, reviewDto } from './serializers';

export const reviewRouter = Router();
const publisher = new RabbitMqEventPublisher();

export async function closeReviewPublisher() {
  await publisher.close();
}

type ReservationEligibility = {
  eligible: boolean;
  reservation: {
    id: string;
    userId: string;
    restaurantId: string;
  };
};

async function photosFor(reviewId: string) {
  return ReviewDataSource.getRepository(PhotoReview).findBy({ reviewId });
}

async function validateRestaurant(restaurantId: string, requestId?: string) {
  await serviceRequest(`${config.services.catalog}/api/v1/internal/v1/restaurants/${restaurantId}`, { requestId });
}

async function publishReviewVerified(review: Review) {
  const event: DomainEvent = {
    eventId: randomUUID(),
    eventVersion: 1,
    eventType: 'review.verified',
    occurredAt: new Date().toISOString(),
    payload: {
      reviewId: review.id,
      restaurantId: review.restaurantId,
      reservationId: review.reservationId,
      rating: Number(review.rating)
    }
  };

  const repo = ReviewDataSource.getRepository(OutboxEvent);
  await repo.save(repo.create({
    eventId: event.eventId,
    eventVersion: event.eventVersion,
    eventType: event.eventType,
    payload: event.payload,
    occurredAt: new Date(event.occurredAt),
    publishedAt: null
  }));
  await publisher.publish(event);
  await repo.update({ eventId: event.eventId }, { publishedAt: new Date() });
}

reviewRouter.get('/restaurants/:restaurantId/reviews', async (req, res, next) => {
  try {
    await validateRestaurant(req.params.restaurantId, req.requestId);
    const { page, limit, skip } = pagination(req.query);
    const [items, total] = await ReviewDataSource.getRepository(Review).findAndCount({
      where: { restaurantId: req.params.restaurantId, isVerified: true },
      order: { date: 'DESC' },
      skip,
      take: limit
    });
    const response = await Promise.all(items.map(async (item) => reviewDto(item, await photosFor(item.id))));
    res.json(listDto(response, page, limit, total));
  } catch (error) {
    next(error);
  }
});

reviewRouter.post('/reviews', authRequired, async (req, res, next) => {
  try {
    const reservationId = requiredString(req.body.reservationId, 'reservationId');
    const existing = await ReviewDataSource.getRepository(Review).findOneBy({ reservationId });
    if (existing) throw new HttpError(409, 'review_already_exists', 'Review already exists');

    const eligibility = await serviceRequest<ReservationEligibility>(
      `${config.services.reservation}/api/v1/internal/v1/reservations/${reservationId}/validate-review-eligibility`,
      {
        method: 'POST',
        requestId: req.requestId,
        body: { userId: req.user!.id }
      }
    );

    const repo = ReviewDataSource.getRepository(Review);
    const review = repo.create({
      userId: req.user!.id,
      restaurantId: eligibility.reservation.restaurantId,
      reservationId,
      date: new Date(),
      rating: String(requiredNumber(req.body.rating, 'rating')),
      comment: optionalString(req.body.comment),
      isVerified: false
    });
    await repo.save(review);
    res.status(201).json(reviewDto(review));
  } catch (error) {
    next(error);
  }
});

reviewRouter.get('/reviews/:reviewId', async (req, res, next) => {
  try {
    const review = await ReviewDataSource.getRepository(Review).findOneBy({ id: req.params.reviewId });
    if (!review) throw new HttpError(404, 'review_not_found', 'Review not found');
    res.json(reviewDto(review, await photosFor(review.id)));
  } catch (error) {
    next(error);
  }
});

reviewRouter.post('/reviews/:reviewId/photos', authRequired, async (req, res, next) => {
  try {
    const review = await ReviewDataSource.getRepository(Review).findOneBy({ id: req.params.reviewId });
    if (!review) throw new HttpError(404, 'review_not_found', 'Review not found');
    if (review.userId !== req.user!.id && req.user!.role !== Role.Admin) throw new HttpError(403, 'forbidden', 'Forbidden');
    const repo = ReviewDataSource.getRepository(PhotoReview);
    const photo = repo.create({ reviewId: review.id, filePath: requiredString(req.body.filePath, 'filePath') });
    await repo.save(photo);
    res.status(201).json(photoReviewDto(photo));
  } catch (error) {
    next(error);
  }
});

reviewRouter.patch('/reviews/:reviewId/verification', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = ReviewDataSource.getRepository(Review);
    const review = await repo.findOneBy({ id: req.params.reviewId });
    if (!review) throw new HttpError(404, 'review_not_found', 'Review not found');
    const wasVerified = review.isVerified;
    review.isVerified = requiredBoolean(req.body.isVerified, 'isVerified');
    await repo.save(review);
    if (!wasVerified && review.isVerified) await publishReviewVerified(review);
    res.json(reviewDto(review, await photosFor(review.id)));
  } catch (error) {
    next(error);
  }
});

reviewRouter.get('/internal/v1/restaurants/:restaurantId/reviews', serviceTokenRequired, async (req, res, next) => {
  try {
    const items = await ReviewDataSource.getRepository(Review).find({
      where: { restaurantId: req.params.restaurantId, isVerified: true },
      order: { date: 'DESC' },
      take: 5
    });
    const response = await Promise.all(items.map(async (item) => reviewDto(item, await photosFor(item.id))));
    res.json(response);
  } catch (error) {
    next(error);
  }
});
