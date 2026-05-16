namespace RestaurantApi;

model Review {
  id: string;
  userId: string;
  restaurantId: string;
  rating: int32;
  comment?: string;
  createdAt: utcDateTime;
}

model CreateReviewDto {
  rating: int32;
  comment?: string;
}