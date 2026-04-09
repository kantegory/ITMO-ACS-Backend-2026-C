import "./enum.tsp";

namespace RestaurantApi;

model Restaurant {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  priceLevel: PriceLevel;
  capacity: int32;
  rating?: float32;
  createdAt: utcDateTime;
}

model CreateRestaurantDto {
  name: string;
  description?: string;
  address: string;
  city: string;
  priceLevel: PriceLevel;
  capacity: int32;
}