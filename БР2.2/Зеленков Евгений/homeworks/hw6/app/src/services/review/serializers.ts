import { PhotoReview, Review } from './entities';

export function photoReviewDto(photo: PhotoReview) {
  return {
    id: photo.id,
    reviewId: photo.reviewId,
    filePath: photo.filePath,
    createdAt: photo.createdAt,
    updatedAt: photo.updatedAt
  };
}

export function reviewDto(review: Review, photos: PhotoReview[] = []) {
  return {
    id: review.id,
    userId: review.userId,
    restaurantId: review.restaurantId,
    reservationId: review.reservationId,
    date: review.date,
    comment: review.comment,
    rating: Number(review.rating),
    isVerified: review.isVerified,
    photos: photos.map(photoReviewDto),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt
  };
}
