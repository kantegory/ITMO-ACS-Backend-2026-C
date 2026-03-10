import { AppDataSource } from "../config/data-source";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Booking, BookingStatus } from "../models/Booking";
import { Property } from "../models/Property";
import { Review, ReviewTargetType } from "../models/Review";

interface CreateReviewInput {
  bookingId: number;
  rating: number;
  comment: string;
}

interface RespondReviewInput {
  responseText: string;
}

export class ReviewsService {
  private reviewRepository = AppDataSource.getRepository(Review);
  private bookingRepository = AppDataSource.getRepository(Booking);
  private propertyRepository = AppDataSource.getRepository(Property);

  async create(data: CreateReviewInput, reviewerId: number) {
    const { bookingId, rating, comment } = data;

    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    if (booking.occupierId !== reviewerId) {
      throw new ForbiddenError("Вы можете оставить отзыв только на свое бронирование");
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestError("Отзыв можно оставить только после завершения бронирования");
    }

    const property = await this.propertyRepository.findOne({ where: { id: booking.propertyId } });
    if (!property) {
      throw new NotFoundError("Объект не найден");
    }

    const existingReview = await this.reviewRepository.findOne({ where: { bookingId } });
    if (existingReview) {
      throw new ConflictError("Отзыв по этому бронированию уже существует");
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestError("Рейтинг должен быть целым числом от 1 до 5");
    }

    if (!comment || !comment.trim()) {
      throw new BadRequestError("Комментарий не может быть пустым");
    }

    const review = this.reviewRepository.create({
      bookingId,
      propertyId: booking.propertyId,
      reviewerId,
      targetType: ReviewTargetType.PROPERTY,
      rating,
      comment: comment.trim(),
    });

    return this.reviewRepository.save(review);
  }

  async getById(id: number) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundError("Отзыв не найден");
    }

    return review;
  }

  async getByPropertyId(propertyId: number) {
    const property = await this.propertyRepository.findOne({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundError("Объект не найден");
    }

    return this.reviewRepository.find({
      where: { propertyId },
      order: { id: "ASC" },
    });
  }

  async respond(id: number, data: RespondReviewInput, userId: number, userRole: string) {
    const { responseText } = data;

    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundError("Отзыв не найден");
    }

    const isOwner = review.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может ответить на отзыв");
    }

    if (!responseText || !responseText.trim()) {
      throw new BadRequestError("Текст ответа не может быть пустым");
    }

    review.responseText = responseText.trim();
    review.responseDate = new Date();

    return this.reviewRepository.save(review);
  }

  async delete(id: number, userId: number, userRole: string) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundError("Отзыв не найден");
    }

    const isAuthor = review.reviewerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError("Недостаточно прав");
    }

    await this.reviewRepository.remove(review);
  }
}

export const reviewsService = new ReviewsService();
