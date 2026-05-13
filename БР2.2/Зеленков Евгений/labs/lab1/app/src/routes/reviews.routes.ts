import { Router } from 'express';
import { AppDataSource } from '../data-source';
import { PhotoReview, Reservation, ReservationStatus, Review, Role } from '../entities';
import { adminRequired, authRequired } from '../auth';
import { HttpError, optionalString, requiredBoolean, requiredNumber, requiredString } from '../http';
import { listDto, photoReviewDto, reviewDto } from '../serializers';
import { pagination } from './common';

export const reviewsRouter = Router();

reviewsRouter.get('/restaurants/:restaurantId/reviews', async (req, res, next) => {
  try {
    const { page, limit, skip } = pagination(req.query);
    const [items, total] = await AppDataSource.getRepository(Review).findAndCount({
      where: { restaurantId: req.params.restaurantId, isVerified: true },
      relations: { photos: true },
      order: { date: 'DESC' },
      skip,
      take: limit
    });

    res.json(listDto(items.map(reviewDto), page, limit, total));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post('/reviews', authRequired, async (req, res, next) => {
  try {
    const reservation = await AppDataSource.getRepository(Reservation).findOneBy({
      id: requiredString(req.body.reservationId, 'reservationId')
    });

    if (!reservation) throw new HttpError(404, 'reservation_not_found', 'Reservation not found');
    if (reservation.userId !== req.user!.id) throw new HttpError(403, 'forbidden', 'Forbidden');

    // Отзыв можно оставить только после реального завершенного бронирования.
    if (reservation.status !== ReservationStatus.Completed) {
      throw new HttpError(409, 'reservation_not_completed', 'Reservation must be completed before review');
    }

    const existing = await AppDataSource.getRepository(Review).findOneBy({ reservationId: reservation.id });
    if (existing) throw new HttpError(409, 'review_already_exists', 'Review already exists');

    const repo = AppDataSource.getRepository(Review);
    const review = repo.create({
      userId: req.user!.id,
      restaurantId: reservation.restaurantId,
      reservationId: reservation.id,
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

reviewsRouter.get('/reviews/:reviewId', async (req, res, next) => {
  try {
    const review = await AppDataSource.getRepository(Review).findOne({
      where: { id: req.params.reviewId },
      relations: { photos: true }
    });

    if (!review) throw new HttpError(404, 'review_not_found', 'Review not found');
    res.json(reviewDto(review));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.post('/reviews/:reviewId/photos', authRequired, async (req, res, next) => {
  try {
    const review = await AppDataSource.getRepository(Review).findOneBy({ id: req.params.reviewId });
    if (!review) throw new HttpError(404, 'review_not_found', 'Review not found');
    if (review.userId !== req.user!.id && req.user!.role !== Role.Admin) {
      throw new HttpError(403, 'forbidden', 'Forbidden');
    }

    const repo = AppDataSource.getRepository(PhotoReview);
    const photo = repo.create({
      reviewId: review.id,
      filePath: requiredString(req.body.filePath, 'filePath')
    });

    await repo.save(photo);
    res.status(201).json(photoReviewDto(photo));
  } catch (error) {
    next(error);
  }
});

reviewsRouter.patch('/reviews/:reviewId/verification', authRequired, adminRequired, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Review);
    const review = await repo.findOne({
      where: { id: req.params.reviewId },
      relations: { photos: true }
    });

    if (!review) throw new HttpError(404, 'review_not_found', 'Review not found');

    review.isVerified = requiredBoolean(req.body.isVerified, 'isVerified');
    await repo.save(review);

    res.json(reviewDto(review));
  } catch (error) {
    next(error);
  }
});
